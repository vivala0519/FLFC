const FIRST_POINT_DATE = '2026-01-01'
const MINIMUM_ATTENDANCES = 2
const SEASONS = [
  { key: 'spring', label: '봄' },
  { key: 'summer', label: '여름' },
  { key: 'autumn', label: '가을' },
  { key: 'winter', label: '겨울' },
]

const parseDate = (dateKey) => {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year < 2026 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
    ? { month }
    : null
}

const nonNegativeNumber = (value) => {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

const seasonKeyForMonth = (month) => month >= 3 && month <= 5 ? 'spring'
  : month >= 6 && month <= 8 ? 'summer'
    : month >= 9 && month <= 11 ? 'autumn' : 'winter'

export const analyzePlayerSeasons = (recordsByYear, fullName, asOfDate, startDate = null) => {
  if (typeof fullName !== 'string' || !fullName.trim() || !parseDate(asOfDate)) return []
  const name = fullName.trim()
  const totals = new Map(SEASONS.map((season) => [season.key, {
    ...season, attendance: 0, points: 0, games: 0,
  }]))
  const days = new Map()

  for (const [year, records] of Object.entries(recordsByYear || {})) {
    if (!/^\d{4}$/.test(year) || !Array.isArray(records)) continue
    for (const record of records) {
      if (typeof record?.id !== 'string' || !/^\d{4}$/.test(record.id)) continue
      const dateKey = `${year}-${record.id.slice(0, 2)}-${record.id.slice(2, 4)}`
      const date = parseDate(dateKey)
      if (!date || dateKey < FIRST_POINT_DATE || dateKey > asOfDate) continue
      // One match date contributes at most one attendance, even if a snapshot repeats it.
      days.set(dateKey, { month: date.month, stats: record.data?.[name] })
    }
  }

  for (const { month, stats } of days.values()) {
    if (!stats || typeof stats !== 'object' || Array.isArray(stats) ||
      !(nonNegativeNumber(stats['출석']) > 0)) continue
    const points = nonNegativeNumber(stats['승점'])
    const games = nonNegativeNumber(stats['경기'])
    if (points === null || games === null || games <= 0) continue
    const season = totals.get(seasonKeyForMonth(month))
    season.attendance++
    season.points += points
    season.games += games
  }

  const eligible = [...totals.values()]
    .filter(({ attendance, points, games }) => attendance >= MINIMUM_ATTENDANCES &&
      Number.isFinite(points) && Number.isFinite(games) && games > 0)
    .map((season) => ({ ...season, pointRate: season.points / season.games }))
  // Current-year joiners can compare only the seasons they have qualified for.
  // Other members must have enough appearances in all four seasons.
  const joinedThisYear = Boolean(parseDate(startDate) && startDate <= asOfDate &&
    startDate.slice(0, 4) === asOfDate.slice(0, 4))
  if (eligible.length === 0 || (!joinedThisYear && eligible.length !== SEASONS.length)) return []

  // Compare cumulative fractions before formatting; daily rates must not be averaged.
  let best = eligible[0]
  for (const season of eligible) {
    if (season.points * best.games > best.points * season.games) best = season
  }
  return eligible.filter((season) => season.points * best.games === best.points * season.games)
}

export default analyzePlayerSeasons
