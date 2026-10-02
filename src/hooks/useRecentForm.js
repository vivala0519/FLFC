import { useEffect, useState } from 'react'
import { analyzeRecentForm, getRecentFormCutoff } from '../apis/analyzeRecentForm.js'
import { getAnalysisYearRecords, subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

const EMPTY_RESULT = { leaders: [], decliners: [], eligibleCount: 0 }
const FIRST_RECORD_YEAR = 2021

export default function useRecentForm(members, asOfDate, cacheDayKey, { year: seasonYear, quarter: seasonQuarter } = {}) {
  const [result, setResult] = useState({ status: 'loading', ...EMPTY_RESULT })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const currentYear = Number(asOfDate.slice(0, 4))
    const earliestRelevantYear = Math.max(FIRST_RECORD_YEAR, Math.min(
      Number(getRecentFormCutoff(asOfDate).slice(0, 4)), Number(seasonYear ?? currentYear),
    ))
    const season = { year: seasonYear, quarter: seasonQuarter }

    setResult({ status: 'loading', ...EMPTY_RESULT })
    if (members.length === 0) return undefined

    const unsubscribe = subscribeAnalysisYearRecords(
      currentYear,
      async (currentRecords) => {
        const currentRevision = ++revision
        const isCurrent = () => !cancelled && currentRevision === revision
        setResult({ status: 'loading', ...EMPTY_RESULT })

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
            setResult({
              status: 'ready',
              leaders: analysis.leaders,
              decliners: analysis.decliners,
              eligibleCount: analysis.eligibleCount,
            })
          }
        } catch {
          if (isCurrent()) setResult({ status: 'error', ...EMPTY_RESULT })
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
  }, [members, asOfDate, cacheDayKey, seasonYear, seasonQuarter])

  return result
}
