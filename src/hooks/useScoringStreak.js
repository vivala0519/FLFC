import { useEffect, useMemo, useState } from 'react'
import { analyzeAssistStreak, analyzeLongestAbsent, analyzeScoringStreak } from '../apis/analyzeScoringStreak.js'
import { getAnalysisYearRecords, subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

const FIRST_RECORD_YEAR = 2021
const EMPTY_STREAK = { name: [], count: 0 }
const EMPTY_RESULT = { ...EMPTY_STREAK, recordsByYear: null }
const EMPTY_LONGEST_ABSENT = { name: [], lastDate: null }

export default function useScoringStreak(members, asOfDate, activeMembers = members, cacheDayKey) {
  const [result, setResult] = useState({ status: 'loading', ...EMPTY_RESULT })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const currentYear = Number(asOfDate.slice(0, 4))
    setResult({ status: 'loading', ...EMPTY_RESULT })
    if (members.length === 0) return undefined
    const olderYears = Array.from(
      { length: Math.max(0, currentYear - FIRST_RECORD_YEAR) },
      (_, index) => FIRST_RECORD_YEAR + index,
    )
    // Past years do not change with today's records; share this load across snapshots.
    let olderRecordsPromise
    const loadOlderRecords = () => {
      olderRecordsPromise ??= Promise.all(olderYears.map(async (year) => [
        year, await getAnalysisYearRecords(year),
      ])).catch((error) => {
        olderRecordsPromise = undefined
        throw error
      })
      return olderRecordsPromise
    }

    const unsubscribe = subscribeAnalysisYearRecords(
      currentYear,
      async (currentRecords) => {
        const currentRevision = ++revision
        setResult({ status: 'loading', ...EMPTY_RESULT })
        try {
          const olderRecords = await loadOlderRecords()
          if (cancelled || currentRevision !== revision) return
          const recordsByYear = {
            ...Object.fromEntries(olderRecords),
            [currentYear]: currentRecords,
          }
          const analysis = analyzeScoringStreak(recordsByYear, members, asOfDate)
          setResult({ status: 'ready', ...analysis, recordsByYear })
        } catch {
          if (!cancelled && currentRevision === revision) {
            setResult({ status: 'error', ...EMPTY_RESULT })
          }
        }
      },
      () => {
        revision++
        if (!cancelled) setResult({ status: 'error', ...EMPTY_RESULT })
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [members, asOfDate, cacheDayKey])

  const assistStreak = useMemo(() => result.status === 'ready'
    ? analyzeAssistStreak(result.recordsByYear, members, asOfDate)
    : EMPTY_STREAK,
  [result.status, result.recordsByYear, members, asOfDate])
  const longestAbsent = useMemo(() => result.status === 'ready'
    ? analyzeLongestAbsent(result.recordsByYear, activeMembers, asOfDate)
    : EMPTY_LONGEST_ABSENT,
  [result.status, result.recordsByYear, activeMembers, asOfDate])
  const { recordsByYear, ...scoringStreak } = result
  return { ...scoringStreak, assistStreak, longestAbsent, recordsByYear }
}
