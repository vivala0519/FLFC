export const createRecordMemberResolver = (members = [], oneCharacterMembers = [], nicknames = {}) => {
  const memberNames = new Set(members.filter((name) => typeof name === 'string').map((name) => name.trim()))
  const singleNameMembers = new Set(oneCharacterMembers)

  return (rawName) => {
    if (typeof rawName !== 'string') return null
    const name = rawName.trim()
    if (!name || name.includes('용병') || name === '자책') return null
    if (memberNames.has(name)) return name

    const nicknameMember = nicknames?.[name]
    if (typeof nicknameMember === 'string' && memberNames.has(nicknameMember.trim())) {
      return nicknameMember.trim()
    }

    const matches = [...memberNames].filter((member) =>
      member.endsWith(name) &&
      (name.length === 1 ? singleNameMembers.has(member) : !singleNameMembers.has(member)),
    )
    return matches.length === 1 ? matches[0] : null
  }
}

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
