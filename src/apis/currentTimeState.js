export function createCurrentTimeState(currentTime = new Date()) {
  const year = currentTime.getFullYear()
  const month = currentTime.getMonth() + 1
  const date = currentTime.getDate()

  return {
    currentTime,
    thisYear: String(year),
    thisMonth: month,
    thisDate: date,
    today: `${String(month).padStart(2, '0')}${String(date).padStart(2, '0')}`,
    thisDay: currentTime.getDay(),
    gameStartTime: new Date(currentTime).setHours(7, 50, 0, 0),
    gameEndTime: new Date(currentTime).setHours(10, 0, 0, 0),
    recordTapCloseTime: new Date(currentTime).setHours(23, 59, 0, 0),
  }
}
