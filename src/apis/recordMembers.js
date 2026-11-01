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
