import { formatDailyRecordStats } from './formatDailyRecordStats.js'

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
const memberNames = (value) => Array.isArray(value) ? value : []

export function formatAdminDailyRecordStats(existingStats, roundRecords, resolveMember) {
  const existing = isObject(existingStats) ? existingStats : {}
  const rounds = (Array.isArray(roundRecords) ? roundRecords : Object.values(roundRecords || {})).filter(isObject)
  const goals = rounds.flatMap((round) => Object.entries(round.goal || {})
    .filter(([id, goal]) => isObject(goal) && id !== 'fever-time-bar' && goal.id !== 'fever-time-bar')
    .map(([id, goal]) => ({ ...goal, id })))
  const members = new Set()
  const previousByMember = new Map()
  for (const [name, value] of Object.entries(existing)) {
    const member = resolveMember(name)
    if (!member) continue
    members.add(member)
    if (!previousByMember.has(member) || name === member) {
      previousByMember.set(member, isObject(value) ? value : {})
    }
  }
  for (const name of rounds.flatMap((round) => [
    ...memberNames(round.participant), ...memberNames(round.winnerTeam?.member),
  ]).concat(goals.flatMap((goal) => [goal.goal, goal.assist]))) {
    const member = resolveMember(name)
    if (member) members.add(member)
  }

  const completedRounds = rounds.filter((round) => memberNames(round.winnerTeam?.number).length > 0)
  const identity = (name) => {
    if (typeof name !== 'string' || !name.trim()) return null
    const trimmed = name.trim()
    return resolveMember(trimmed) || (trimmed.includes('용병') || trimmed === '자책' ? trimmed : null)
  }
  const canRebuildPoints = completedRounds.every((round) => {
    const numbers = round.winnerTeam.number
    if (![1, 2].includes(numbers.length) || numbers.some((number) => !['string', 'number'].includes(typeof number) || !String(number).trim())
      || new Set(numbers.map((number) => String(number).trim())).size !== numbers.length) return false
    const participants = memberNames(round.participant).map(identity)
    const winners = memberNames(round.winnerTeam?.member).map(identity)
    if (!participants.length || !winners.length || participants.some((name) => !name) || winners.some((name) => !name)) return false
    const participating = new Set(participants)
    return winners.every((name) => participating.has(name))
  })

  const computed = formatDailyRecordStats({ data: { admin: [...members] } }, goals, completedRounds, resolveMember)
  const next = { ...existing }
  for (const member of members) {
    const previous = previousByMember.get(member) || {}
    next[member] = {
      ...previous,
      출석: hasOwn(previous, '출석') ? previous.출석 : 1,
      골: computed[member].골,
      어시: computed[member].어시,
      승점: canRebuildPoints ? computed[member].승점 : hasOwn(previous, '승점') ? previous.승점 : 0,
      경기: canRebuildPoints ? computed[member].경기 : hasOwn(previous, '경기') ? previous.경기 : 0,
    }
  }
  return next
}
