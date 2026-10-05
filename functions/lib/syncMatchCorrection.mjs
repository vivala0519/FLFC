import { finalizeMatchRounds } from './finalizeMatch.mjs'
import { createRecordMemberResolver, formatDailyRecordStats } from './records.mjs'
import { publishMatchArchive, RecordDataError } from './matchArchive.mjs'

export async function syncMatchCorrection({ firestore, database, target, beforeRounds, beforeStats,
  source, now = Date.now(), changedAt = now }) {
  if (!target || !Number.isFinite(changedAt) || now < target.endAt || changedAt < target.endAt) return null
  const [stateSnapshot, archiveSnapshot, weeklySnapshot, membersSnapshot, statsSnapshot] = await firestore.getAll(
    firestore.doc(`matchFinalizations/${target.key}`), firestore.doc(`matchArchives/${target.key}`),
    firestore.doc(`weeklyTeam/${target.weeklyTeamId}`), firestore.doc('members/members'),
    firestore.doc(`${target.year}/${target.day}`))
  const state = stateSnapshot.data()
  if (state?.status === 'finalizing' && state.leaseUntil > now) throw new Error('Finalization still running')
  const archive = archiveSnapshot.data()
  const rawRounds = (await database.ref(`${target.year}/${target.day}_rounds`).get()).val() || {}
  const weeklyTeam = { id: target.weeklyTeamId, data: weeklySnapshot.data() || archive?.weeklyTeam?.data || {} }
  const members = membersSnapshot.data()
  if (Object.keys(rawRounds).length && (!Object.keys(weeklyTeam.data).length || !Array.isArray(members?.total))) {
    throw new RecordDataError('Weekly team or members are missing')
  }
  const resolver = createRecordMemberResolver(members?.total || [], members?.oneCharacter || [], members?.nickName || {})
  const aggregate = (raw) => {
    const rounds = finalizeMatchRounds(raw, weeklyTeam)
    const goals = Object.values(rounds).flatMap((round) => Object.entries(round.goal || {})
      .filter(([id, goal]) => id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar')
      .map(([id, goal]) => ({ ...goal, id })))
    return { rounds, stats: formatDailyRecordStats(weeklyTeam, goals, Object.values(rounds), resolver) }
  }
  let rounds
  let baseStats
  let previousBaseStats
  try {
    if (Object.keys(rawRounds).length) {
      const result = aggregate(rawRounds)
      rounds = result.rounds
      baseStats = result.stats
    } else {
      // Deleting an entire RTDB date is not permission to erase saved personal history.
      rounds = {}
      baseStats = archive?.baseStats || archive?.stats
        || (source === 'firestore' ? beforeStats || {} : statsSnapshot.data() || {})
    }
    if (!archive) {
      // Lazily initialize historical archives while preserving pre-existing manual adjustments.
      previousBaseStats = source === 'rtdb' && beforeRounds && Object.keys(beforeRounds).length
        ? aggregate(beforeRounds).stats : baseStats
    }
  } catch (error) {
    throw new RecordDataError(error.message)
  }
  return publishMatchArchive({ firestore, target, rounds, weeklyTeam, baseStats, previousBaseStats, now,
    expectedArchiveRevision: archive?.revision || null })
}
