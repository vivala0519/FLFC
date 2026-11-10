const FIRST_POINT_YEAR = 2026

const validDate = (dateKey) => {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
}

const nonNegativeNumber = (value) => {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export const analyzeCareerPointRate = (recordsByYear, asOfDate) => {
  const result = { name: [], pointRate: null, totalDays: 0, requiredDays: 0 }
  if (!validDate(asOfDate)) return result

  const days = new Map()
  for (const [year, records] of Object.entries(recordsByYear || {})) {
    if (!/^\d{4}$/.test(year) || Number(year) < FIRST_POINT_YEAR || !Array.isArray(records)) continue
    for (const record of records) {
      if (typeof record?.id !== 'string' || !/^\d{4}$/.test(record.id)) continue
      const date = `${year}-${record.id.slice(0, 2)}-${record.id.slice(2, 4)}`
      if (!validDate(date) || date > asOfDate) continue
      days.set(date, record.data)
    }
  }

  const players = new Map()
  for (const data of days.values()) {
    const attendees = new Map(Object.entries(data || {})
      .filter(([name, stats]) => name.trim() && !name.includes('용병') && name.trim() !== '자책' &&
        nonNegativeNumber(stats?.['출석']) > 0)
      .map(([name, stats]) => [name.trim(), stats]))
    if (attendees.size === 0) continue
    result.totalDays++

    for (const [name, stats] of attendees) {
      const player = players.get(name) || { name, attendanceDays: 0, points: 0, games: 0 }
      // A partial attendance still counts as one date, matching BEST FIVE eligibility.
      player.attendanceDays++
      const points = nonNegativeNumber(stats['승점'])
      const games = nonNegativeNumber(stats['경기'])
      if (points !== null && games !== null && games > 0) {
        player.points += points
        player.games += games
      }
      players.set(name, player)
    }
  }

  result.requiredDays = Math.ceil(result.totalDays * 7 / 10)
  const eligible = [...players.values()].filter(({ attendanceDays, games }) =>
    attendanceDays * 10 >= result.totalDays * 7 && games > 0)
  if (eligible.length === 0) return result

  // Rank cumulative fractions before rounding and preserve every exact tie.
  let best = eligible[0]
  for (const player of eligible) {
    if (player.points * best.games > best.points * player.games) best = player
  }
  result.name = eligible.filter((player) => player.points * best.games === best.points * player.games)
    .map(({ name }) => name).sort((a, b) => a.localeCompare(b, 'ko'))
  result.pointRate = best.points / best.games
  return result
}

export default analyzeCareerPointRate
