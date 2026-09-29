const FIRST_RECORD_YEAR = 2021
const VALID_GOAL_TIME = /^([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/

const emptyResult = () => ({
  sameTeam: { partners: [], count: 0 },
  goalCombination: { partners: [], goals: 0, attackPoints: 0 },
})

const validDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month && date.getUTCDate() === day
}

const dateFromParts = (year, monthDay) => {
  if (!/^20\d{2}$/.test(year) || !/^\d{4}$/.test(monthDay)) return null
  const numericYear = Number(year)
  const month = Number(monthDay.slice(0, 2))
  const day = Number(monthDay.slice(2, 4))
  if (numericYear < FIRST_RECORD_YEAR || !validDate(numericYear, month, day)) return null
  return `${year}-${monthDay.slice(0, 2)}-${monthDay.slice(2, 4)}`
}

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const cutoffDate = (asOfDate) => {
  if (typeof asOfDate !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(asOfDate)) return today()
  const date = dateFromParts(asOfDate.slice(0, 4), asOfDate.slice(5, 7) + asOfDate.slice(8, 10))
  return date || today()
}

const getLeaders = (counts, amount) => {
  const maximum = Math.max(0, ...counts.values())
  return {
    partners: maximum === 0 ? [] : [...counts]
      .filter(([, count]) => count === maximum)
      .map(([name]) => name)
      .sort((first, second) => first.localeCompare(second, 'ko')),
    [amount]: maximum,
  }
}

// Firestore team rosters and RTDB goal events use short names; member history also
// contains retired members, so resolve against the full roster before comparing.
export const analyzeCareerPartners = (
  weeklyTeams,
  roundYears,
  playerName,
  totalMembers,
  asOfDate,
) => {
  if (typeof playerName !== 'string' || !playerName.trim() || playerName.includes('용병')) {
    return emptyResult()
  }

  const player = playerName.trim()
  const members = [...new Set((Array.isArray(totalMembers) ? totalMembers : [])
    .filter((name) => typeof name === 'string' && name.trim() && !name.includes('용병'))
    .map((name) => name.trim()))]
  const resolveMember = (rawName) => {
    if (typeof rawName !== 'string') return null
    const name = rawName.trim()
    if (!name || name.includes('용병')) return null
    if (name === player) return player
    if (members.includes(name)) return name
    const matches = members.filter((member) => member.includes(name))
    return matches.length === 1 ? matches[0] : name
  }

  const cutoff = cutoffDate(asOfDate)
  const sameTeamCounts = new Map()
  const seenTeamDays = new Set()
  for (const entry of Array.isArray(weeklyTeams) ? weeklyTeams : []) {
    if (!/^\d{6}$/.test(entry?.id || '')) continue
    const date = dateFromParts(`20${entry.id.slice(0, 2)}`, entry.id.slice(2))
    if (!date || date > cutoff) continue

    for (const teamNumber of ['1', '2', '3']) {
      const roster = entry?.data?.[teamNumber]
      if (!Array.isArray(roster)) continue
      const teammates = new Set(roster.map(resolveMember).filter(Boolean))
      if (!teammates.has(player)) continue
      for (const partner of teammates) {
        if (partner === player) continue
        const key = `${date}\u0000${partner}`
        if (seenTeamDays.has(key)) continue
        seenTeamDays.add(key)
        sameTeamCounts.set(partner, (sameTeamCounts.get(partner) || 0) + 1)
      }
    }
  }

  const combinationCounts = new Map()
  for (const [year, yearData] of Object.entries(roundYears || {})) {
    if (!/^20\d{2}$/.test(year)) continue
    const dateKeys = new Set(Object.keys(yearData || {})
      .filter((key) => /^\d{4}(?:_rounds)?$/.test(key))
      .map((key) => key.slice(0, 4)))
    for (const dateKey of dateKeys) {
      const date = dateFromParts(year, dateKey)
      if (!date || date > cutoff) continue

      // Older dates store goals directly under MMDD. Where both formats exist,
      // rounds are authoritative: the legacy copy may retain edited/deleted goals.
      const roundKey = `${dateKey}_rounds`
      const goals = Object.hasOwn(yearData, roundKey)
        ? Object.values(yearData[roundKey] || {}).flatMap((round) => Object.entries(round?.goal || {}))
        : Object.entries(yearData[dateKey] || {})
      for (const [id, goal] of goals) {
        if (id === 'fever-time-bar' || goal?.id === 'fever-time-bar' ||
          typeof goal?.time !== 'string' || !VALID_GOAL_TIME.test(goal.time)) continue
        const scorer = resolveMember(goal?.goal)
        const assistant = resolveMember(goal?.assist)
        if (!scorer || !assistant || scorer === assistant) continue
        const partner = scorer === player ? assistant : assistant === player ? scorer : null
        if (partner) combinationCounts.set(partner, (combinationCounts.get(partner) || 0) + 1)
      }
    }
  }

  const sameTeam = getLeaders(sameTeamCounts, 'count')
  const goalCombination = getLeaders(combinationCounts, 'goals')
  return {
    sameTeam,
    goalCombination: {
      ...goalCombination,
      attackPoints: goalCombination.goals * 2,
    },
  }
}

export default analyzeCareerPartners
