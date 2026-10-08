const { createHash, randomUUID } = require('node:crypto')
const { createRecordMemberResolver, finalizeRound, formatDailyRecordStats } = require('./recordLogic.cjs')

const KST_OFFSET = 9 * 60 * 60 * 1000
const LEASE_MS = 5 * 60 * 1000

class FinalizationBusyError extends Error {
  constructor(message = 'Another invocation is finalizing this game.') {
    super(message)
    this.name = 'FinalizationBusyError'
  }
}

// scheduleTime identifies the original game even when a retry runs on Monday.
function getScheduledGameContext(scheduleTime) {
  const scheduledAt = new Date(scheduleTime)
  if (!Number.isFinite(scheduledAt.getTime())) throw new Error('A valid scheduleTime is required.')
  const koreaTime = new Date(scheduledAt.getTime() + KST_OFFSET)
  if (koreaTime.getUTCDay() !== 0 || koreaTime.getUTCHours() !== 10 || koreaTime.getUTCMinutes() !== 0) {
    throw new Error('Game finalization must originate from the Sunday 10:00 Asia/Seoul schedule.')
  }
  const year = String(koreaTime.getUTCFullYear())
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(koreaTime.getUTCDate()).padStart(2, '0')
  const today = `${month}${day}`
  return { year, today, key: `${year}/${today}`, weeklyTeamId: `${year.slice(-2)}${today}`, scheduledAt: scheduledAt.getTime() }
}

function calculateDailyMvp(stats) {
  const players = Object.entries(stats).map(([name, values]) => ({
    name, goal: values['골'], assist: values['어시'],
  }))
  const highest = Math.max(0, ...players.map((player) => player.goal + player.assist))
  if (!highest) return []
  const bestPlayers = players.filter((player) => player.goal + player.assist === highest)
  return bestPlayers.length <= 5 ? bestPlayers : []
}

function calculateTeamScores(rounds) {
  const scores = Object.fromEntries(['1', '2', '3'].map((team) => [team, { win: 0, draw: 0, lost: 0 }]))
  const teamScore = (team) => (scores[String(team)] ||= { win: 0, draw: 0, lost: 0 })
  for (const round of Object.values(rounds || {})) {
    if (!Array.isArray(round.winnerTeam?.number)) continue
    const winners = round.winnerTeam.number.map(String)
    if (winners.length === 1) teamScore(winners[0]).win++
    else if (winners.length === 2) winners.forEach((team) => teamScore(team).draw++)
    if (round.lostTeam) teamScore(round.lostTeam).lost++
  }
  return scores
}

const versionOf = (rounds) => createHash('sha256').update(JSON.stringify(rounds || {})).digest('hex')

function prepareDailyRecords(rounds, weeklyTeam, members) {
  if (!weeklyTeam?.data || !members?.members?.length) throw new Error('Weekly teams or member information is missing.')
  const resolveMember = createRecordMemberResolver(members.members, members.oneCharacterMembers, members.nicknames)
  const rosters = Object.values(weeklyTeam.data)
  if (!rosters.some((roster) => Array.isArray(roster) && roster.some((name) => typeof name === 'string' && name.trim()))) {
    throw new Error('There are no players in the weekly teams.')
  }
  for (const roster of rosters) {
    if (!Array.isArray(roster)) throw new Error('A weekly team roster is invalid.')
    for (const name of roster) {
      if (typeof name !== 'string') throw new Error('A player name in the weekly teams is invalid.')
      if (name.trim() && !name.includes('용병') && !resolveMember(name)) {
        throw new Error(`Cannot resolve a weekly team player: ${name}`)
      }
    }
  }
  const records = Object.values(rounds || {})
  const goals = records.flatMap((round) => Object.entries(round.goal || {}).map(([id, goal]) => ({ ...goal, id })))
  const stats = formatDailyRecordStats(weeklyTeam, goals, records, resolveMember)
  return { stats, bestPlayers: calculateDailyMvp(stats), teamScores: calculateTeamScores(rounds) }
}

function closeOpenRounds(rounds, weeklyTeam) {
  if (!rounds || typeof rounds !== 'object' || Array.isArray(rounds)) throw new Error('The game rounds are missing or invalid.')
  const closed = { ...rounds }
  for (const [id, round] of Object.entries(rounds)) {
    if (!round || typeof round !== 'object' || !Number.isFinite(Number(round.index))) {
      throw new Error(`Invalid round: ${id}`)
    }
    if (round.winnerTeam) continue // A fever-time round retains the result decided before the fever marker.
    const result = finalizeRound(round, weeklyTeam)
    if (result === undefined) throw new Error(`Round ${id} is incomplete; retry after the remaining goal data arrives.`)
    if (result === null) delete closed[id]
    else closed[id] = result
  }
  return closed
}

function createGameFinalizer(adapter, { now = Date.now, owner = randomUUID, leaseMs = LEASE_MS } = {}) {
  return async function finalizeGame(scheduleTime) {
    const context = getScheduledGameContext(scheduleTime)
    if (now() < context.scheduledAt) throw new Error('The scheduled game has not ended yet.')
    const initialStatus = await adapter.readStatus(context)
    if (initialStatus?.finalized) return { state: 'already-finalized', context }
    const [initialRounds, weeklyTeam, members] = await Promise.all([
      adapter.readRounds(context), adapter.readWeeklyTeam(context), adapter.readMembers(context),
    ])
    const resumingClosure = initialStatus?.end_game && Number.isFinite(initialStatus.closed_at)
      && ['rounds', 'records', 'error'].includes(initialStatus.phase)
    if ((!initialRounds || Object.keys(initialRounds).length === 0) && !resumingClosure) {
      return { state: 'skipped', reason: 'no-rounds', context }
    }
    if (!weeklyTeam || weeklyTeam.id !== context.weeklyTeamId) throw new Error('The weekly team for the scheduled game is missing.')
    // Validate names before acquiring the closure lock or modifying game data.
    prepareDailyRecords(initialRounds, weeklyTeam, members)
    const invocationId = owner()
    const acquisition = await adapter.transactStatus(context, (status) => {
      const current = status || {}
      if (current.finalized) return undefined
      if (current.lock && current.lock.expires_at > now()) return undefined
      return {
        ...current, end_game: true, finalizing: true, finalized: false,
        closed_at: current.closed_at || now(), phase: 'rounds', error: null,
        lock: { owner: invocationId, expires_at: now() + leaseMs },
      }
    })
    if (!acquisition.committed) {
      if (acquisition.value?.finalized) return { state: 'already-finalized', context }
      // Throw so Scheduler retries after a crashed invocation's lease expires.
      throw new FinalizationBusyError()
    }

    const ownStatus = async (changes, release = false) => {
      const result = await adapter.transactStatus(context, (status) => {
        if (status?.lock?.owner !== invocationId) return undefined
        const updated = { ...status, ...changes }
        if (release) delete updated.lock
        else updated.lock = { owner: invocationId, expires_at: now() + leaseMs }
        return updated
      })
      if (!result.committed) throw new FinalizationBusyError('The finalization lease is no longer owned by this invocation.')
    }

    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        await ownStatus({ phase: 'rounds' })
        let closureError
        const closed = await adapter.transactRounds(context, (rounds) => {
          closureError = null
          try { return closeOpenRounds(rounds || (resumingClosure ? {} : null), weeklyTeam) }
          catch (error) { closureError = error; return undefined }
        })
        if (!closed.committed) throw closureError || new Error('The final rounds could not be saved.')
        const finalRecords = prepareDailyRecords(closed.value, weeklyTeam, members)
        await ownStatus({ phase: 'records' })
        await adapter.writeFinalRecords(context, finalRecords)
        const latestRounds = await adapter.readRounds(context)
        if (versionOf(latestRounds) !== versionOf(closed.value)) continue
        await ownStatus({
          end_game: true, finalizing: false, finalized: true, phase: 'complete',
          finalized_at: now(), error: null,
          best_players: finalRecords.bestPlayers, team_scores: finalRecords.teamScores,
        }, true)
        return { state: 'finalized', context, ...finalRecords }
      }
      throw new Error('Game records continued to change during finalization.')
    } catch (error) {
      try {
        await ownStatus({ finalizing: false, finalized: false, phase: 'error', error: String(error.message).slice(0, 500) }, true)
      } catch (statusError) {
        // Preserve the original error; a replacement owner may now be finalizing the same game.
        adapter.logStatusError?.(statusError, context)
      }
      throw error
    }
  }
}

module.exports = {
  calculateDailyMvp, calculateTeamScores, closeOpenRounds, createGameFinalizer, getScheduledGameContext,
  prepareDailyRecords, FinalizationBusyError,
}
