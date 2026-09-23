const WINDOW_SIZE = 2

const getDateKey = (year, id) => {
  if (!/^\d{4}$/.test(year) || !/^\d{4}$/.test(id)) return null
  const month = Number(id.slice(0, 2))
  const day = Number(id.slice(2, 4))
  const date = new Date(Date.UTC(Number(year), month - 1, day))
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null
  return `${year}-${id.slice(0, 2)}-${id.slice(2, 4)}`
}

const getPoints = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

const getMatchStats = (stats) => {
  if (stats?.['경기'] == null || stats?.['승점'] == null) return null
  const matches = Number(stats['경기'])
  const winPoints = Number(stats['승점'])
  if (!Number.isFinite(matches) || matches < 0 || !Number.isFinite(winPoints) || winPoints < 0) return null
  return { matches, winPoints }
}

const pointsPerGame = (appearances) => {
  const totals = appearances.reduce((sum, { matchStats }) => ({
    matches: sum.matches + matchStats.matches,
    winPoints: sum.winPoints + matchStats.winPoints,
  }), { matches: 0, winPoints: 0 })
  return totals.matches > 0 ? totals.winPoints / totals.matches : null
}

export const getRecentFormCutoff = (asOfDate) => {
  const mostRecentSunday = new Date(`${asOfDate}T00:00:00Z`)
  mostRecentSunday.setUTCDate(mostRecentSunday.getUTCDate() - mostRecentSunday.getUTCDay())
  // Count the most recent Sunday as week one, so the eighth Sunday is seven weeks earlier.
  mostRecentSunday.setUTCDate(mostRecentSunday.getUTCDate() - 7 * 7)
  return mostRecentSunday.toISOString().slice(0, 10)
}

// Use daily attendance totals so an attended day with no goals/assists still counts.
export const analyzeRecentForm = (recordsByYear, members, asOfDate) => {
  const appearances = new Map(
    [...new Set(members)].filter((name) => name && !name.includes('용병')).map((name) => [name, []]),
  )
  const quarterAttendances = new Map([...appearances.keys()].map((name) => [name, 0]))
  const currentYear = asOfDate.slice(0, 4)
  const currentQuarter = Math.ceil(Number(asOfDate.slice(5, 7)) / 3)
  const cutoffDate = getRecentFormCutoff(asOfDate)
  const days = new Map()
  for (const [year, records] of Object.entries(recordsByYear || {})) {
    for (const record of records || []) {
      const date = getDateKey(year, record.id)
      if (date && date <= asOfDate) days.set(date, record.data)
    }
  }

  for (const [date, data] of [...days].sort(([a], [b]) => b.localeCompare(a))) {
    const inCurrentQuarter = date.slice(0, 4) === currentYear && Math.ceil(Number(date.slice(5, 7)) / 3) === currentQuarter
    for (const [name, playerAppearances] of appearances) {
      const stats = data?.[name]
      if (!(Number(stats?.['출석']) > 0)) continue
      if (inCurrentQuarter) quarterAttendances.set(name, quarterAttendances.get(name) + 1)
      if (playerAppearances.length < WINDOW_SIZE * 2) {
        playerAppearances.push({
          date,
          points: getPoints(stats['골']) + getPoints(stats['어시']),
          matchStats: getMatchStats(stats),
        })
      }
    }
  }

  const comparisons = []
  const missingMembers = []
  for (const [name, playerAppearances] of appearances) {
    if (quarterAttendances.get(name) < 2) continue
    if (playerAppearances.length < WINDOW_SIZE * 2) {
      missingMembers.push(name)
      continue
    }
    const previousGames = playerAppearances.slice(WINDOW_SIZE)
    if (previousGames.some(({ date }) => date < cutoffDate)) continue
    if (playerAppearances.some(({ matchStats }) => matchStats === null)) continue
    const recentGames = playerAppearances.slice(0, WINDOW_SIZE)
    const recentWinPointsPerGame = pointsPerGame(recentGames)
    const previousWinPointsPerGame = pointsPerGame(previousGames)
    if (recentWinPointsPerGame === null || previousWinPointsPerGame === null) continue
    const recentAverage = recentGames.reduce((sum, game) => sum + game.points, 0) / WINDOW_SIZE
    const previousAverage = previousGames.reduce((sum, game) => sum + game.points, 0) / WINDOW_SIZE
    comparisons.push({
      name,
      previousAverage,
      recentAverage,
      increase: recentAverage - previousAverage,
      previousWinPointsPerGame,
      recentWinPointsPerGame,
      winPointIncrease: recentWinPointsPerGame - previousWinPointsPerGame,
    })
  }

  return {
    leaders: comparisons
      .filter(({ increase, winPointIncrease }) =>
        increase >= 0 && winPointIncrease >= 0 && (increase > 0 || winPointIncrease > 0),
      )
      .sort((a, b) => b.increase - a.increase || b.winPointIncrease - a.winPointIncrease || a.name.localeCompare(b.name, 'ko')),
    decliners: comparisons
      .filter(({ increase, winPointIncrease }) =>
        increase <= 0 && winPointIncrease <= 0 && (increase < 0 || winPointIncrease < 0),
      )
      .sort((a, b) => a.increase - b.increase || a.winPointIncrease - b.winPointIncrease || a.name.localeCompare(b.name, 'ko')),
    eligibleCount: comparisons.length,
    missingMembers,
  }
}
