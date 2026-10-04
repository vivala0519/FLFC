export const formatDailyRecordStats = (weeklyTeamData, goalRecords, roundRecords, resolveMember) => {
  const stats = {}
  const attendingMembers = Object.values(weeklyTeamData?.data || {})
    .flatMap((roster) => Array.isArray(roster) ? roster : [])
    .map(resolveMember)
    .filter(Boolean)

  for (const member of new Set(attendingMembers)) {
    stats[member] = { 출석: 1, 골: 0, 어시: 0, 승점: 0, 경기: 0 }
  }

  for (const record of goalRecords) {
    if (record.id === 'fever-time-bar') continue
    const scorer = resolveMember(record.goal)
    const assistant = resolveMember(record.assist)
    if (stats[scorer]) stats[scorer]['골']++
    if (stats[assistant]) stats[assistant]['어시']++
  }

  for (const round of roundRecords) {
    // Resolve names before deduplicating so full and short names count as one player.
    const participants = new Set((Array.isArray(round.participant) ? round.participant : [])
      .map(resolveMember).filter(Boolean))
    for (const member of participants) {
      if (stats[member]) stats[member]['경기']++
    }

    const winnerTeam = round.winnerTeam
    if (!Array.isArray(winnerTeam?.number) || !Array.isArray(winnerTeam?.member)) continue
    const points = winnerTeam.number.length === 1 ? 3 : winnerTeam.number.length === 2 ? 1 : 0
    const winners = new Set(winnerTeam.member.map(resolveMember).filter(Boolean))
    for (const member of winners) {
      if (stats[member]) stats[member]['승점'] += points
    }
  }

  return stats
}
