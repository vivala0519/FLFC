import { useEffect, useMemo, useState } from 'react'
import { analyzeRecentForm, getRecentFormCutoff } from '../apis/analyzeRecentForm.js'
import { getAnalysisYearRecords, subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

const EMPTY_RESULT = { leaders: [], decliners: [], eligibleCount: 0 }
const FIRST_RECORD_YEAR = 2021

export default function useRecentForm(members, asOfDate, cacheDayKey, { year: seasonYear, quarter: seasonQuarter, memberInfo, cleanSheetDays, cleanSheetStatus } = {}) {
  const requestKey = JSON.stringify([members, asOfDate, cacheDayKey, seasonYear, seasonQuarter])
  const [source, setSource] = useState({ requestKey: null, status: 'loading', recordsByYear: null })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const currentYear = Number(asOfDate.slice(0, 4))
    const earliestRelevantYear = Math.max(FIRST_RECORD_YEAR, Math.min(
      Number(getRecentFormCutoff(asOfDate).slice(0, 4)), Number(seasonYear ?? currentYear),
    ))
    const season = { year: seasonYear, quarter: seasonQuarter }

    const updateSource = (status, recordsByYear = null) => setSource({ requestKey, status, recordsByYear })
    updateSource('loading')
    if (members.length === 0) return undefined

    const unsubscribe = subscribeAnalysisYearRecords(
      currentYear,
      async (currentRecords) => {
        const currentRevision = ++revision
        const isCurrent = () => !cancelled && currentRevision === revision
        updateSource('loading')

        try {
          const recordsByYear = { [currentYear]: currentRecords }
          let analysis = analyzeRecentForm(recordsByYear, members, asOfDate, season)

          for (
            let year = currentYear - 1;
            year >= earliestRelevantYear && (analysis.missingMembers.length > 0 || year >= Number(seasonYear ?? currentYear));
            year--
          ) {
            recordsByYear[year] = await getAnalysisYearRecords(year)
            if (!isCurrent()) return
            analysis = analyzeRecentForm(recordsByYear, members, asOfDate, season)
          }

          if (isCurrent()) {
            updateSource('ready', recordsByYear)
          }
        } catch {
          if (isCurrent()) updateSource('error')
        }
      },
      () => {
        revision++
        if (!cancelled) updateSource('error')
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [members, asOfDate, cacheDayKey, seasonYear, seasonQuarter, requestKey])

  // Round/member updates only recalculate the comparison; they never restart Firestore reads.
  return useMemo(() => {
    const needsCleanSheets = memberInfo === null || members.some((name) =>
      memberInfo?.[name]?.goalKeeper === true || memberInfo?.[name]?.goalkeeper === true,
    )
    if (source.requestKey !== requestKey) return { status: 'loading', ...EMPTY_RESULT }
    if (source.status === 'error' || (needsCleanSheets && cleanSheetStatus === 'error')) {
      return { status: 'error', ...EMPTY_RESULT }
    }
    if (source.status !== 'ready' || memberInfo === null ||
      (needsCleanSheets && (cleanSheetStatus !== 'ready' || !cleanSheetDays))) {
      return { status: 'loading', ...EMPTY_RESULT }
    }
    const analysis = analyzeRecentForm(source.recordsByYear, members, asOfDate,
      { year: seasonYear, quarter: seasonQuarter }, { memberInfo, cleanSheetDays })
    return { status: 'ready', leaders: analysis.leaders, decliners: analysis.decliners, eligibleCount: analysis.eligibleCount }
  }, [source, requestKey, members, asOfDate, seasonYear, seasonQuarter, memberInfo, cleanSheetDays, cleanSheetStatus])
}
