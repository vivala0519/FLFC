// Match writes use the latest wall clock, including after asynchronous dialogs.
export function isGameWriteAllowed({ year, day, status, now = new Date(), allowBeforeEight = true }) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return false
  const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const currentYear = String(koreaTime.getUTCFullYear())
  const currentDay = `${String(koreaTime.getUTCMonth() + 1).padStart(2, '0')}${String(koreaTime.getUTCDate()).padStart(2, '0')}`
  const minute = koreaTime.getUTCHours() * 60 + koreaTime.getUTCMinutes()
  return koreaTime.getUTCDay() === 0 && minute >= (allowBeforeEight ? 470 : 480) && minute < 600
    && String(year) === currentYear && day === currentDay
    && status?.loaded === true && status.year === currentYear && status.day === currentDay
    && status.data?.end_game !== true
}
