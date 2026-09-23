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

export const getRecentFormCutoff = (asOfDate) => {
  const mostRecentSunday = new Date(`${asOfDate}T00:00:00Z`)
  mostRecentSunday.setUTCDate(mostRecentSunday.getUTCDate() - mostRecentSunday.getUTCDay())
  // Count the most recent Sunday as week one, so the eighth Sunday is seven weeks earlier.
  mostRecentSunday.setUTCDate(mostRecentSunday.getUTCDate() - 7 * 7)
  return mostRecentSunday.toISOString().slice(0, 10)
}

// Compare totals from the most recent two appearances with the previous two.
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
          attackPoints: getPoints(stats['골']) + getPoints(stats['어시']),
          winPoints: getPoints(stats['승점']),
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
    const recentGames = playerAppearances.slice(0, WINDOW_SIZE)
    const recentAttackPoints = recentGames.reduce((sum, game) => sum + game.attackPoints, 0)
    const previousAttackPoints = previousGames.reduce((sum, game) => sum + game.attackPoints, 0)
    const recentWinPoints = recentGames.reduce((sum, game) => sum + game.winPoints, 0)
    const previousWinPoints = previousGames.reduce((sum, game) => sum + game.winPoints, 0)
    comparisons.push({
      name,
      previousAttackPoints,
      recentAttackPoints,
      increase: recentAttackPoints - previousAttackPoints,
      previousWinPoints,
      recentWinPoints,
      winPointIncrease: recentWinPoints - previousWinPoints,
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
