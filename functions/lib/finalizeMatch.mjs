import { randomUUID } from 'node:crypto'
import { createRecordMemberResolver, finalizeRound, formatDailyRecordStats, getRoundParticipants } from './records.mjs'
import { publishMatchArchive } from './matchArchive.mjs'

export { matchRevision } from './matchArchive.mjs'

export function finalizeMatchRounds(rounds, weeklyTeam) {
  if (!rounds || Object.keys(rounds).length === 0) return {}
  const entries = Object.entries(rounds).sort(([, a], [, b]) => Number(a.index) - Number(b.index))
  if (entries.some(([, round]) => !round || !Number.isFinite(Number(round.index)))) throw new Error('Invalid round index')
  const result = structuredClone(rounds)
  for (const [id, round] of entries.slice(0, -1)) {
    if (!round.winnerTeam) throw new Error(`Unfinished earlier round: ${id}`)
  }
  const [lastId, lastRound] = entries[entries.length - 1]
  if (!lastRound.winnerTeam) {
    const finished = finalizeRound(lastRound, weeklyTeam)
    if (finished === undefined) throw new Error(`Incomplete last round: ${lastId}`)
    if (finished === null) delete result[lastId]
    else result[lastId] = finished
  }
  for (const round of Object.values(result)) {
    if (!Array.isArray(round.winnerTeam?.number) || ![1, 2].includes(round.winnerTeam.number.length)
      || !Array.isArray(round.winnerTeam.member)) throw new Error('Invalid finished winner')
    if (!Array.isArray(round.participant) || round.participant.length === 0) {
      const participants = getRoundParticipants(weeklyTeam, round.teamList)
      if (participants.length === 0) throw new Error('Cannot resolve round participants')
      round.participant = participants
    }
  }
  return result
}

// Dependencies are injected so tests never connect to the production project.
export async function finalizeMatch({ firestore, database, target, now = Date.now() }) {
  if (now < target.endAt) throw new Error('The match has not reached its closing time')
  const stateRef = firestore.doc(`matchFinalizations/${target.key}`)
  const archiveRef = firestore.doc(`matchArchives/${target.key}`)
  const statsRef = firestore.doc(`${target.year}/${target.day}`)
  const roundsRef = database.ref(`${target.year}/${target.day}_rounds`)
  const token = randomUUID()
  let previousState
  await firestore.runTransaction(async (transaction) => {
    previousState = (await transaction.get(stateRef)).data() || {}
    if (previousState.status === 'finalizing' && previousState.leaseUntil > now) throw new Error('Finalization already running')
    transaction.set(stateRef, { ...previousState, status: 'finalizing', token, leaseUntil: now + 300000 })
  })
  try {
    const [weeklySnapshot, memberSnapshot, savedStats, savedArchive] = await firestore.getAll(
      firestore.doc(`weeklyTeam/${target.weeklyTeamId}`), firestore.doc('members/members'), statsRef, archiveRef)
    const initial = (await roundsRef.get()).val() || {}
    const weeklyTeam = { id: target.weeklyTeamId, data: weeklySnapshot.data() || {} }
    const members = memberSnapshot.data()
    if (Object.keys(initial).length && (!weeklySnapshot.exists || !Array.isArray(members?.total))) {
      throw new Error('Weekly team or members are missing')
    }
    let rounds = {}
    if (Object.keys(initial).length) {
      const committed = await roundsRef.transaction((current) => current
        ? finalizeMatchRounds(current, weeklyTeam) : undefined)
      if (!committed.committed) throw new Error('Round finalization was not committed')
      rounds = committed.snapshot.val() || {}
    }
    const resolver = createRecordMemberResolver(members?.total || [], members?.oneCharacter || [], members?.nickName || {})
    const goalRecords = Object.values(rounds).flatMap((round) => Object.entries(round.goal || {})
      .filter(([id, goal]) => id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar')
      .map(([id, goal]) => ({ ...goal, id })))
    // Missing RTDB data must never overwrite previously saved activity with zeros.
    const stats = Object.keys(initial).length
      ? formatDailyRecordStats(weeklyTeam, goalRecords, Object.values(rounds), resolver)
      : savedArchive.data()?.baseStats || savedStats.data() || {}
    if (Object.keys(initial).length && !Object.keys(stats).length && Object.keys(savedStats.data() || {}).length) {
      throw new Error('An empty roster cannot overwrite saved stats')
    }
    return await publishMatchArchive({ firestore, target, rounds, weeklyTeam, baseStats: stats,
      now, leaseToken: token, writeStats: Object.keys(initial).length > 0 })
  } catch (error) {
    await firestore.runTransaction(async (transaction) => {
      const current = (await transaction.get(stateRef)).data()
      if (current?.token === token) transaction.set(stateRef, {
        ...previousState, status: 'error', updatedAt: now, error: String(error.message).slice(0, 300),
      })
    })
    throw error
  }
}
