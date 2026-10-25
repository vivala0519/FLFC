export const getRecordAvailability = (time, weeklyTeams) => {
  const isReady = Array.isArray(weeklyTeams)
  const documentId = `${String(time.thisYear).slice(-2)}${time.today}`
  const isOffDay = isReady && weeklyTeams.find((team) => team.id === documentId)?.data?.isOffDay === true
  const lastSunday = new Date(Date.UTC(Number(time.thisYear), Number(time.today.slice(0, 2)) - 1, Number(time.today.slice(2))))
  lastSunday.setUTCDate(lastSunday.getUTCDate() - time.thisDay)
  const lastSundayId = `${String(lastSunday.getUTCFullYear()).slice(-2)}${String(lastSunday.getUTCMonth() + 1).padStart(2, '0')}${String(lastSunday.getUTCDate()).padStart(2, '0')}`
  const isPreviousGameOffDay = isReady && time.thisDay !== 0
    && weeklyTeams.find((team) => team.id === lastSundayId)?.data?.isOffDay === true
  const canRegister = isReady && !isOffDay && time.thisDay === 0
    && time.currentTime >= time.gameStartTime && time.currentTime <= time.gameEndTime

  return { isReady, isOffDay, isPreviousGameOffDay, canRegister }
}
