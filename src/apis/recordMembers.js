export { createRecordMemberResolver } from '../../functions/matchStats.mjs'

export const findWeeklyMemberTeam = (weeklyTeamData, rawName, resolveMember) => {
  if (typeof rawName !== 'string') return null
  const name = rawName.trim()
  if (!name || ['용병', '자책'].includes(name)) return null

  const member = resolveMember(name)
  const teams = Object.entries(weeklyTeamData?.data || {}).filter(([, roster]) =>
    Array.isArray(roster) && roster.some((entry) =>
      member ? resolveMember(entry) === member : typeof entry === 'string' && entry.trim() === name,
    ),
  )
  return teams.length === 1 ? teams[0][0] : null
}

export const hasGoalAssistTeamMismatch = (weeklyTeamData, scorer, assistant, resolveMember) => {
  const names = [scorer, assistant].map((name) => typeof name === 'string' ? name.trim() : '')
  if (names.some((name) => !name || name.includes('용병') || name === '자책')) return false

  const scorerTeam = findWeeklyMemberTeam(weeklyTeamData, names[0], resolveMember)
  const assistantTeam = findWeeklyMemberTeam(weeklyTeamData, names[1], resolveMember)
  return Boolean(scorerTeam && assistantTeam && scorerTeam !== assistantTeam)
}
