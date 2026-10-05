const koreanDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function getMatchTargetForDate(year, day) {
  if (!/^20\d{2}$/.test(String(year)) || !/^\d{4}$/.test(String(day))) return null
  day = String(day)
  const dateKey = `${year}-${day.slice(0, 2)}-${day.slice(2)}`
  const date = new Date(`${dateKey}T00:00:00+09:00`)
  if (!Number.isFinite(date.getTime())) return null
  const parts = Object.fromEntries(koreanDate.formatToParts(date).map(({ type, value }) => [type, value]))
  if (`${parts.year}${parts.month}${parts.day}` !== `${year}${day}`) return null
  return {
    key: `${year}${day}`, year: String(year), day, dateKey,
    weeklyTeamId: `${String(year).slice(-2)}${day}`,
    endAt: new Date(`${dateKey}T10:00:00+09:00`).getTime(),
    isCurrentSunday: false,
  }
}

export function getMatchTarget(now = new Date(), { scheduled = false } = {}) {
  const date = new Date(now)
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid match date')
  const parts = Object.fromEntries(koreanDate.formatToParts(date).map(({ type, value }) => [type, value]))
  const target = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  const weekday = target.getUTCDay()
  if (weekday !== 0 && (scheduled || weekday !== 6)) target.setUTCDate(target.getUTCDate() - weekday)
  const year = String(target.getUTCFullYear())
  const day = `${String(target.getUTCMonth() + 1).padStart(2, '0')}${String(target.getUTCDate()).padStart(2, '0')}`
  const dateKey = `${year}-${day.slice(0, 2)}-${day.slice(2)}`
  return {
    key: `${year}${day}`, year, day, dateKey,
    weeklyTeamId: `${year.slice(-2)}${day}`,
    endAt: new Date(`${dateKey}T10:00:00+09:00`).getTime(),
    isCurrentSunday: weekday === 0,
  }
}
