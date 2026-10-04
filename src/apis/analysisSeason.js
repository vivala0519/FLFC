import { getQuarterRoundGoals } from './roundGoals.js'

export const getAnalysisSeasonPeriod = (year, month) => {
  const yearKey = String(year)
  if (!/^\d{4}$/.test(yearKey) || Number(yearKey) < 1000 ||
    !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('A valid year and month are required for an analysis season.')
  }
  return { year: yearKey, month, quarter: Math.ceil(month / 3) }
}

export const getPreviousAnalysisSeason = (year, month) => {
  const current = getAnalysisSeasonPeriod(year, month)
  return current.quarter === 1
    ? getAnalysisSeasonPeriod(Number(current.year) - 1, 12)
    : getAnalysisSeasonPeriod(current.year, (current.quarter - 1) * 3)
}

const isValidRecordDate = (year, id) => {
  if (!/^\d{4}$/.test(id || '')) return false
  const month = Number(id.slice(0, 2))
  const day = Number(id.slice(2, 4))
  const date = new Date(Date.UTC(Number(year), month - 1, day))
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === month && date.getUTCDate() === day
}

// A played week can have attendance without any goals. Empty placeholder rounds
// and metadata documents do not make a quarter available.
export const countAnalysisSeasonWeeks = (year, month, records, yearRoundData) => {
  const { quarter } = getAnalysisSeasonPeriod(year, month)
  const attendanceDates = new Set()
  for (const record of Array.isArray(records) ? records : []) {
    if (!isValidRecordDate(year, record?.id) ||
      Math.ceil(Number(record.id.slice(0, 2)) / 3) !== quarter) continue
    if (Object.values(record.data || {}).some((stats) => {
      const attendance = Number(stats?.['출석'])
      return Number.isFinite(attendance) && attendance > 0
    })) attendanceDates.add(record.id)
  }
  const goalDates = new Set(getQuarterRoundGoals(yearRoundData, month)
    .filter(([id]) => isValidRecordDate(year, id))
    .map(([id]) => id))
  return Math.max(attendanceDates.size, goalDates.size)
}

// Only the immediately preceding quarter can be used as a fallback.
export const selectAnalysisSeason = (year, month, currentData, previousData) => {
  const current = getAnalysisSeasonPeriod(year, month)
  const currentWeeks = countAnalysisSeasonWeeks(year, month, currentData?.records, currentData?.yearRoundData)
  if (currentWeeks > 0 || !previousData) {
    return { ...current, availableWeeks: currentWeeks, isPreviousSeason: false }
  }
  const previous = getPreviousAnalysisSeason(year, month)
  const previousWeeks = countAnalysisSeasonWeeks(previous.year, previous.month, previousData.records, previousData.yearRoundData)
  return previousWeeks > 0
    ? { ...previous, availableWeeks: previousWeeks, isPreviousSeason: true }
    : { ...current, availableWeeks: 0, isPreviousSeason: false }
}
