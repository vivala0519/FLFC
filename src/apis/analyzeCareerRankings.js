import { rankCareerEntries } from './rankCareerEntries.js'

const FIRST_RECORD_YEAR = 2021
const FIRST_POINT_YEAR = 2026
const formatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })
const formatCount = (value, unit) => `${formatter.format(value)}${unit}`
const emptyRankings = () => Object.fromEntries([
  'goals', 'assists', 'attackPoints', 'points', 'attendance', 'mvp', 'cleanSheets',
  'scoringStreak', 'assistStreak', 'longestAbsent',
].map((key) => [key, []]))

const isValidDate = (dateKey) => {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
}

const positiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

// Consume the analysis tab's already-loaded records; this function performs no reads.
export const analyzeCareerRankings = ({ recordsByYear = {}, members = [], asOfDate, mvpNames = [], cleanSheetTotals = null } = {}) => {
  const result = emptyRankings()
  if (!isValidDate(asOfDate)) return result
  const eligible = new Set((Array.isArray(members) || members instanceof Set ? [...members] : [])
    .filter((name) => typeof name === 'string' && name.trim() && !name.includes('용병')))
  const days = new Map()
  for (const [year, records] of Object.entries(recordsByYear || {})) {
    if (!/^\d{4}$/.test(year) || Number(year) < FIRST_RECORD_YEAR || !Array.isArray(records)) continue
    for (const record of records) {
      if (!/^\d{4}$/.test(record?.id || '')) continue
      const dateKey = `${year}-${record.id.slice(0, 2)}-${record.id.slice(2, 4)}`
      if (!isValidDate(dateKey) || dateKey > asOfDate) continue
      days.set(dateKey, record.data)
    }
  }

  const players = new Map()
  for (const [dateKey, data] of [...days].sort(([a], [b]) => a.localeCompare(b))) {
    for (const [name, stats] of Object.entries(data || {})) {
      if (!eligible.has(name)) continue
      const player = players.get(name) || {
        name, goals: 0, assists: 0, points: 0, attendance: 0,
        scoringStreak: 0, scoringBest: 0, assistStreak: 0, assistBest: 0,
        lastAttendance: null,
      }
      const goals = positiveNumber(stats?.['골'])
      const assists = positiveNumber(stats?.['어시'])
      const attendance = positiveNumber(stats?.['출석'])
      player.goals += goals
      player.assists += assists
      if (Number(dateKey.slice(0, 4)) >= FIRST_POINT_YEAR) player.points += positiveNumber(stats?.['승점'])
      player.attendance += attendance
      // Unplayed weeks and absences preserve a streak; an attended zero-stat day resets it.
      if (attendance > 0) {
        player.scoringStreak = goals > 0 ? player.scoringStreak + 1 : 0
        player.assistStreak = assists > 0 ? player.assistStreak + 1 : 0
        player.scoringBest = Math.max(player.scoringBest, player.scoringStreak)
        player.assistBest = Math.max(player.assistBest, player.assistStreak)
        player.lastAttendance = dateKey
      }
      players.set(name, player)
    }
  }

  const rankField = (field, unit, valueFor = (player) => player[field]) => rankCareerEntries(
    [...players.values()].flatMap((player) => {
      const value = valueFor(player)
      return Number.isFinite(value) && value > 0
        ? [{ name: player.name, value, count: formatCount(value, unit) }] : []
    }),
  )
  result.goals = rankField('goals', '골')
  result.assists = rankField('assists', '어시')
  result.attackPoints = rankField('attackPoints', '점', ({ goals, assists }) => goals + assists)
  result.points = rankField('points', '점')
  result.attendance = rankField('attendance', '회')

  const mvpCounts = new Map()
  for (const name of Array.isArray(mvpNames) ? mvpNames : []) {
    if (eligible.has(name)) mvpCounts.set(name, (mvpCounts.get(name) || 0) + 1)
  }
  const rankCounts = (counts) => rankCareerEntries([...counts].flatMap(([name, rawValue]) => {
    const value = positiveNumber(rawValue)
    return eligible.has(name) && value > 0 ? [{ name, value, count: formatCount(value, '회') }] : []
  }))
  result.mvp = rankCounts(mvpCounts)
  result.cleanSheets = rankCounts(cleanSheetTotals instanceof Map ? cleanSheetTotals : new Map())

  const rankStreak = (field, bestField) => rankCareerEntries([...players.values()]
    .filter((player) => player[field] > 0)
    .map((player) => ({
      name: player.name, value: player[field], count: formatCount(player[field], '일 연속'),
      ...(player[bestField] > player[field]
        ? { detail: `통산 최장 ${formatter.format(player[bestField])}일` } : {}),
    })))
  result.scoringStreak = rankStreak('scoringStreak', 'scoringBest')
  result.assistStreak = rankStreak('assistStreak', 'assistBest')
  result.longestAbsent = rankCareerEntries([...players.values()]
    .filter(({ lastAttendance }) => lastAttendance !== null)
    .map(({ name, lastAttendance }) => ({
      name, value: Date.parse(`${lastAttendance}T00:00:00.000Z`),
      count: lastAttendance.replaceAll('-', '.'),
    })), (a, b) => a.value - b.value)
  return result
}

export default analyzeCareerRankings
