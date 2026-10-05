export const getRoundParticipants = (weeklyTeamData, teamList = []) => {
  if (!weeklyTeamData?.data || !Array.isArray(teamList)) return []
  return teamList.flatMap((team) => weeklyTeamData.data[String(team)] || [])
}

export const createRecordMemberResolver = (members = [], oneCharacterMembers = [], nicknames = {}) => {
  const memberNames = new Set(members.filter((name) => typeof name === 'string').map((name) => name.trim()))
  const singleNameMembers = new Set(oneCharacterMembers)
  return (rawName) => {
    if (typeof rawName !== 'string') return null
    const name = rawName.trim()
    if (!name || name.includes('용병') || name === '자책') return null
    if (memberNames.has(name)) return name
    const nicknameMember = nicknames?.[name]
    if (typeof nicknameMember === 'string' && memberNames.has(nicknameMember.trim())) return nicknameMember.trim()
    const matches = [...memberNames].filter((member) => member.endsWith(name)
      && (name.length === 1 ? singleNameMembers.has(member) : !singleNameMembers.has(member)))
    return matches.length === 1 ? matches[0] : null
  }
}

export const findWeeklyMemberTeam = (weeklyTeamData, rawName, resolveMember) => {
  if (typeof rawName !== 'string') return null
  const name = rawName.trim()
  if (!name || ['용병', '자책'].includes(name)) return null
  const member = resolveMember(name)
  const teams = Object.entries(weeklyTeamData?.data || {}).filter(([, roster]) =>
    Array.isArray(roster) && roster.some((entry) => member
      ? resolveMember(entry) === member
      : typeof entry === 'string' && entry.trim() === name))
  return teams.length === 1 ? teams[0][0] : null
}

export const finalizeRound = (round, weeklyTeamData) => {
  if (!round || round.winnerTeam) return
  const time = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(round.time || '')
  if (!time) return
  const [, hours, minutes, seconds = '0'] = time
  if (hours > 23 || minutes > 59 || seconds > 59) return
  const startTime = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  const goalEntries = Object.entries(round.goal || {}).filter(
    ([id, goal]) => id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar')
  const recordedTeams = round.getGoalTeam ?? []
  if (!Array.isArray(recordedTeams)) return
  const goalTeams = recordedTeams.map(String)
  if (goalEntries.length === 0 && goalTeams.length === 0 && startTime >= 9 * 3600 + 55 * 60) return null
  // The browser writes the goal details and scoring team separately.
  if (goalEntries.length !== goalTeams.length || !Array.isArray(round.teamList)) return
  const teamList = [...new Set(round.teamList.map(String))]
  if (teamList.length !== 2 || !teamList.every((team) => Array.isArray(weeklyTeamData?.data?.[team]))) return
  if (!goalTeams.every((team) => teamList.includes(team))) return
  const scores = teamList.map((team) => goalTeams.filter((scoringTeam) => scoringTeam === team).length)
  const winners = teamList.filter((_, index) => scores[index] === Math.max(...scores))
  return {
    ...round,
    participant: getRoundParticipants(weeklyTeamData, teamList),
    winnerTeam: { number: winners, member: getRoundParticipants(weeklyTeamData, winners) },
    lostTeam: winners.length === 1 ? teamList.find((team) => team !== winners[0]) : false,
  }
}

export const formatDailyRecordStats = (weeklyTeamData, goalRecords, roundRecords, resolveMember) => {
  const stats = {}
  const attendees = Object.values(weeklyTeamData?.data || {})
    .flatMap((roster) => Array.isArray(roster) ? roster : []).map(resolveMember).filter(Boolean)
  for (const member of new Set(attendees)) stats[member] = { 출석: 1, 골: 0, 어시: 0, 승점: 0, 경기: 0 }
  for (const record of goalRecords) {
    if (record.id === 'fever-time-bar') continue
    const scorer = resolveMember(record.goal)
    const assistant = resolveMember(record.assist)
    if (stats[scorer]) stats[scorer]['골']++
    if (stats[assistant]) stats[assistant]['어시']++
  }
  for (const round of roundRecords) {
    const participants = new Set((Array.isArray(round.participant) ? round.participant : []).map(resolveMember).filter(Boolean))
    for (const member of participants) if (stats[member]) stats[member]['경기']++
    const winner = round.winnerTeam
    if (!Array.isArray(winner?.number) || !Array.isArray(winner?.member)) continue
    const points = winner.number.length === 1 ? 3 : winner.number.length === 2 ? 1 : 0
    for (const member of new Set(winner.member.map(resolveMember).filter(Boolean))) {
      if (stats[member]) stats[member]['승점'] += points
    }
  }
  return stats
}

export function getDailyMVP(stats) {
  const players = Object.entries(stats).map(([name, stat]) => ({
    name, goal: Number(stat['골'] || 0), assist: Number(stat['어시'] || 0),
  }))
  const mostPoints = Math.max(0, ...players.map((player) => player.goal + player.assist))
  const winners = players.filter((player) => player.goal + player.assist === mostPoints)
  return winners.length <= 5 ? winners : []
}
