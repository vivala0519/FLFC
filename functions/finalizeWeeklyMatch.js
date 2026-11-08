const getMatchDate = (scheduleTime) => {
  const date = new Date(new Date(scheduleTime).getTime() + 9 * 60 * 60 * 1000)
  if (Number.isNaN(date.getTime()) || date.getUTCDay() !== 0 || date.getUTCHours() < 10) {
    throw new Error('Finalization requires a Sunday schedule at or after 10:00 Asia/Seoul')
  }
  const year = String(date.getUTCFullYear())
  const mmdd = date.toISOString().slice(5, 10).replace('-', '')
  return { year, mmdd, id: year.slice(-2) + mmdd }
}

const createWeeklyMatchFinalizer = ({ firestore, rtdb, timestamp }) => async (scheduleTime) => {
  const { finalizeRound, formatDailyRecordStats, createRecordMemberResolver } = await import('./matchStats.mjs')
  const { year, mmdd, id } = getMatchDate(scheduleTime)
  const completionRef = firestore.collection('_matchFinalizations').doc(id)
  if ((await completionRef.get()).data()?.status === 'completed') return { status: 'completed', id }

  const weeklySnapshot = await firestore.collection('weeklyTeam').doc(id).get()
  const roster = weeklySnapshot.data()
  if (!roster || roster.isOffDay === true) return { status: 'skipped', id, reason: 'no-match' }
  if (!Object.values(roster).some((team) => Array.isArray(team) && team.some((name) => typeof name === 'string' && name.trim()))) {
    return { status: 'skipped', id, reason: 'empty-roster' }
  }
  const members = (await firestore.collection('members').doc('members').get()).data()
  if (!Array.isArray(members?.total) || members.total.length === 0) throw new Error('Missing member information')
  const resolveMember = createRecordMemberResolver(
    members.total.filter((name) => !(members.retired || []).includes(name)), members.oneCharacter, members.nickName,
  )
  const weeklyTeam = { id, data: roster }
  const roundRef = rtdb.ref(`${year}/${mmdd}_rounds`)
  let cacheListener
  let result
  try {
    // Keep the cache alive until the transaction finishes. A cold client's initial
    // null would otherwise abort the updater before it ever reads server data.
    const initialSnapshot = await new Promise((resolve, reject) => {
      cacheListener = resolve
      roundRef.on('value', cacheListener, reject)
    })
    if (!initialSnapshot.exists()) return { status: 'skipped', id, reason: 'no-rounds' }

    result = await roundRef.transaction((current) => {
      const rounds = Object.entries(current || {}).sort(([, a], [, b]) => Number(a.index) - Number(b.index))
      if (rounds.length === 0) return undefined
      if (rounds.slice(0, -1).some(([, round]) => !round.winnerTeam)) {
        throw new Error('An earlier round is still unfinished; refusing a partial finalization')
      }
      const [roundId, lastRound] = rounds[rounds.length - 1]
      if (lastRound.winnerTeam) return current
      const finalized = finalizeRound(lastRound, weeklyTeam)
      if (finalized === undefined) throw new Error('Last round has incomplete team or goal data')
      const next = { ...current }
      if (finalized === null) delete next[roundId]
      else next[roundId] = finalized
      return next
    }, undefined, false)
  } finally {
    if (cacheListener) roundRef.off('value', cacheListener)
  }
  if (!result.committed) return { status: 'skipped', id, reason: 'no-rounds' }

  const rounds = Object.values(result.snapshot.val() || {})
  const goals = rounds.flatMap((round) => Object.entries(round.goal || {}).map(([goalId, goal]) => ({ ...goal, id: goalId })))
  const stats = formatDailyRecordStats(weeklyTeam, goals, rounds, resolveMember)
  if (Object.keys(stats).length === 0) throw new Error('No registered members in the match roster')
  const recordRef = firestore.collection(year).doc(mmdd)
  const mvpRef = firestore.collection('daily_mvp').doc(id)
  await firestore.runTransaction(async (transaction) => {
    const completed = await transaction.get(completionRef)
    if (completed.data()?.status === 'completed') return
    const previous = (await transaction.get(recordRef)).data() || {}
    const mvp = await transaction.get(mvpRef)
    // A manual late-arrival correction may already have been made just after 10:00.
    const finalStats = Object.fromEntries(Object.entries(stats).map(([name, value]) => [
      name, { ...value, 출석: previous[name]?.['출석'] === 0.5 ? 0.5 : value['출석'] },
    ]))
    transaction.set(recordRef, finalStats)
    const maxPoints = Math.max(...Object.values(finalStats).map((value) => value['골'] + value['어시']))
    const bestPlayers = Object.entries(finalStats).filter(([, value]) => value['골'] + value['어시'] === maxPoints)
      .map(([name, value]) => ({ name, goal: value['골'], assist: value['어시'] }))
    if (!mvp.exists && bestPlayers.length > 0 && bestPlayers.length <= 5) transaction.set(mvpRef, { bestPlayers })
    transaction.set(completionRef, { status: 'completed', completedAt: timestamp(), year, date: mmdd })
  })
  return { status: 'completed', id }
}

module.exports = { createWeeklyMatchFinalizer, getMatchDate }
