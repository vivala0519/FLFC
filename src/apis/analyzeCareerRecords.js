const METRICS = ['goals', 'assists', 'points', 'pointRate']

const validNonNegativeNumber = (value) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

const nonNegativeNumber = (value) => validNonNegativeNumber(value) ?? 0

const validRecordDate = (year, id) => {
  if (!/^\d{4}$/.test(year) || !/^\d{4}$/.test(id)) return null
  const month = Number(id.slice(0, 2))
  const day = Number(id.slice(2, 4))
  const date = new Date(Date.UTC(Number(year), month - 1, day))
  if (date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null
  return { month, date: `${year}-${id.slice(0, 2)}-${id.slice(2, 4)}` }
}

const emptyStats = () => ({ attendance: 0, goals: 0, assists: 0, points: 0, games: 0 })

export const analyzeCareerRecords = (recordsByYear, fullName, asOfDate = null) => {
  const totals = emptyStats()
  let trackedPointGames = 0
  let trackedRatePoints = 0
  const careerHigh = Object.fromEntries(METRICS.map((metric) => [metric, { value: 0, season: null }]))
  const seasons = new Map()
  const quarterTotals = new Map()
  let hasRecords = false

  if (typeof fullName !== 'string' || !fullName.trim()) {
    return { hasRecords, totals: { ...totals, pointRate: 0 }, careerHigh, quarters: [] }
  }

  for (const [year, records] of Object.entries(recordsByYear || {})) {
    if (!Array.isArray(records)) continue
    for (const record of records) {
      const recordDate = validRecordDate(year, record?.id)
      const stats = record?.data?.[fullName]
      if (!recordDate || (asOfDate && recordDate.date > asOfDate) ||
        !stats || typeof stats !== 'object' ||
        !(nonNegativeNumber(stats['출석']) > 0)) continue

      const quarter = Math.ceil(recordDate.month / 3)
      const quarterOrder = Number(year) * 4 + quarter
      const seasonKey = year === '2021' ? year : `${year}-${quarter}`
      const season = seasons.get(seasonKey) || {
        label: year === '2021' ? `${year}년` : `${year}년 ${quarter}분기`,
        order: Number(year) * 4 + (year === '2021' ? 4 : quarter),
        ...emptyStats(),
        hasPointData: false,
        trackedPointGames: 0,
        trackedRatePoints: 0,
      }
      const goals = nonNegativeNumber(stats['골'])
      const assists = nonNegativeNumber(stats['어시'])
      const games = nonNegativeNumber(stats['경기'])
      const attendance = nonNegativeNumber(stats['출석'])
      const points = validNonNegativeNumber(stats['승점'])
      const validGames = validNonNegativeNumber(stats['경기'])
      const quarterStats = quarterTotals.get(quarterOrder) || {
        attendance: 0, goals: 0, assists: 0, points: 0, hasPointData: false,
      }
      totals.attendance += attendance
      totals.goals += goals
      totals.assists += assists
      totals.games += games
      season.attendance += attendance
      season.goals += goals
      season.assists += assists
      season.games += games
      quarterStats.attendance += attendance
      quarterStats.goals += goals
      quarterStats.assists += assists
      if (points !== null) {
        totals.points += points
        season.points += points
        season.hasPointData = true
        quarterStats.points += points
        quarterStats.hasPointData = true
        if (validGames !== null) {
          trackedPointGames += validGames
          trackedRatePoints += points
          season.trackedPointGames += validGames
          season.trackedRatePoints += points
        }
      }
      seasons.set(seasonKey, season)
      quarterTotals.set(quarterOrder, quarterStats)
      hasRecords = true
    }
  }

  for (const season of [...seasons.values()].sort((a, b) => b.order - a.order)) {
    const values = {
      goals: season.goals,
      assists: season.assists,
      points: season.hasPointData ? season.points : null,
      pointRate: season.trackedPointGames > 0
        ? season.trackedRatePoints / season.trackedPointGames : null,
    }
    for (const metric of METRICS) {
      const value = values[metric]
      if (value !== null && (careerHigh[metric].season === null || value > careerHigh[metric].value)) {
        careerHigh[metric] = { value, season: season.label }
      }
    }
  }

  const quarterOrders = [...quarterTotals.keys()].sort((a, b) => a - b)
  const quarters = []
  if (quarterOrders.length > 0) {
    for (let order = quarterOrders[0]; order <= quarterOrders[quarterOrders.length - 1]; order++) {
      const year = Math.floor((order - 1) / 4)
      const quarter = (order - 1) % 4 + 1
      const stats = quarterTotals.get(order)
      quarters.push({
        key: `${year}-${quarter}`,
        label: `${year}년 ${quarter}분기`,
        year,
        quarter,
        attendance: stats?.attendance ?? 0,
        goals: stats?.goals ?? null,
        assists: stats?.assists ?? null,
        points: stats?.hasPointData ? stats.points : null,
      })
    }
  }

  return {
    hasRecords,
    totals: { ...totals, pointRate: trackedPointGames > 0 ? trackedRatePoints / trackedPointGames : 0 },
    careerHigh,
    quarters,
  }
}

export default analyzeCareerRecords
