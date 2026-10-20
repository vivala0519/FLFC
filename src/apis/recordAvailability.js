export const getRecordAvailability = (time, weeklyTeams) => {
  const isReady = Array.isArray(weeklyTeams)
  const documentId = `${String(time.thisYear).slice(-2)}${time.today}`
  const isOffDay = isReady && weeklyTeams.find((team) => team.id === documentId)?.data?.isOffDay === true
  const canRegister = isReady && !isOffDay && time.thisDay === 0
    && time.currentTime >= time.gameStartTime && time.currentTime <= time.gameEndTime

  return { isReady, isOffDay, canRegister }
}
