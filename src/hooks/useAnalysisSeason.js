import { useEffect, useState } from 'react'
import { get, getDatabase, onValue, ref } from 'firebase/database'
import { getAnalysisCachePeriod, getCachedAnalysisData, setCachedAnalysisData } from '../apis/analysisDataCache.js'
import { getAnalysisYearRecords, subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'
import { countAnalysisSeasonWeeks, getAnalysisSeasonPeriod, getPreviousAnalysisSeason, selectAnalysisSeason } from '../apis/analysisSeason.js'

const emptyResult = (year, month, status = 'loading') => ({
  status,
  year: String(year),
  month,
  quarter: Math.ceil(month / 3),
  records: null,
  yearRoundData: null,
  calendarYearRoundData: null,
  availableWeeks: 0,
  isPreviousSeason: false,
})

const loadYearRounds = (year) => getCachedAnalysisData(`rtdb:${year}`, async () => {
  const snapshot = await get(ref(getDatabase(), String(year)))
  return snapshot.val() || {}
})

const makeRequestKey = (year, month, cacheDayKey) => `${year}:${month}:${cacheDayKey || ''}`

export default function useAnalysisSeason(year, month, cacheDayKey) {
  const yearKey = String(year)
  const [state, setState] = useState(() => ({
    requestKey: makeRequestKey(yearKey, month, cacheDayKey),
    result: emptyResult(yearKey, month),
  }))

  useEffect(() => {
    const requestKey = makeRequestKey(yearKey, month, cacheDayKey)
    const setResult = (result) => setState({ requestKey, result })
    let cancelled = false
    let failed = false
    let revision = 0
    let currentRecords = null
    let calendarYearRoundData = null
    let unsubscribeRecords = () => {}
    let unsubscribeRounds = () => {}
    setResult(emptyResult(yearKey, month))

    const fail = () => {
      failed = true
      revision++
      if (!cancelled) setResult(emptyResult(yearKey, month, 'error'))
    }

    const update = async () => {
      if (cancelled || failed || currentRecords === null || calendarYearRoundData === null) return
      const currentRevision = ++revision
      const isCurrent = () => !cancelled && !failed && currentRevision === revision
      const currentData = { records: currentRecords, yearRoundData: calendarYearRoundData }
      setResult(emptyResult(yearKey, month))
      try {
        let previousData = null
        if (countAnalysisSeasonWeeks(yearKey, month, currentData.records, currentData.yearRoundData) === 0) {
          const previous = getPreviousAnalysisSeason(yearKey, month)
          if (previous.year === yearKey) {
            previousData = currentData
          } else {
            const [records, yearRoundData] = await Promise.all([
              getAnalysisYearRecords(previous.year), loadYearRounds(previous.year),
            ])
            if (!isCurrent()) return
            previousData = { records, yearRoundData }
          }
        }
        if (!isCurrent()) return
        const selection = selectAnalysisSeason(yearKey, month, currentData, previousData)
        const selectedData = selection.isPreviousSeason ? previousData : currentData
        setResult({
          status: 'ready',
          ...selection,
          records: selectedData.records,
          yearRoundData: selectedData.yearRoundData,
          calendarYearRoundData: currentData.yearRoundData,
        })
      } catch {
        if (isCurrent()) setResult(emptyResult(yearKey, month, 'error'))
      }
    }

    try {
      getAnalysisSeasonPeriod(yearKey, month)
      unsubscribeRecords = subscribeAnalysisYearRecords(yearKey, (records) => {
        if (cancelled || failed) return
        currentRecords = records
        void update()
      }, fail)

      if (getAnalysisCachePeriod().isSunday) {
        unsubscribeRounds = onValue(ref(getDatabase(), yearKey), (snapshot) => {
          if (cancelled || failed) return
          calendarYearRoundData = snapshot.val() || {}
          void setCachedAnalysisData(`rtdb:${yearKey}`, calendarYearRoundData)
          void update()
        }, fail)
      } else {
        loadYearRounds(yearKey).then((rounds) => {
          if (cancelled || failed) return
          calendarYearRoundData = rounds
          void update()
        }).catch(fail)
      }
    } catch {
      fail()
    }

    return () => {
      cancelled = true
      revision++
      unsubscribeRecords()
      unsubscribeRounds()
    }
  }, [yearKey, month, cacheDayKey])

  // During a period change, effects have not yet reset state on the first render.
  // Never expose data from the previous requested period during that render.
  return state.requestKey === makeRequestKey(yearKey, month, cacheDayKey)
    ? state.result
    : emptyResult(yearKey, month)
}
