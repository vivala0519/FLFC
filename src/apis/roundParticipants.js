export const getRoundParticipants = (weeklyTeamData, teamList = []) => {
  if (!weeklyTeamData?.data || !Array.isArray(teamList)) return []

  return teamList.flatMap((teamNumber) => (
    weeklyTeamData.data[String(teamNumber)] || []
  ))
}
