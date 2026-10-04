import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { analyzeBestFive } from '../apis/analyzeBestFive.js'
import { subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

export default function useBestFive(year, month, cacheDayKey, providedRecords) {
  const yearKey = String(year)
  const requestKey = `${yearKey}:${cacheDayKey || ''}`
  const recordsProvided = providedRecords !== undefined
  const [recordState, setRecordState] = useState({ requestKey: null, status: 'loading', records: null })
  const [memberState, setMemberState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    let cancelled = false
    setMemberState({ status: 'loading', data: null })
    const unsubscribeInfo = onSnapshot(doc(db, 'members', 'info'), (snapshot) => {
      if (!cancelled) setMemberState({ status: 'ready', data: snapshot.data() || {} })
    }, () => {
      if (!cancelled) setMemberState({ status: 'error', data: null })
    })

    return () => {
      cancelled = true
      unsubscribeInfo()
    }
  }, [cacheDayKey])

  useEffect(() => {
    if (recordsProvided) return undefined
    let cancelled = false
    setRecordState({ requestKey, status: 'loading', records: null })
    const unsubscribe = subscribeAnalysisYearRecords(yearKey, (records) => {
      if (!cancelled) setRecordState({ requestKey, status: 'ready', records })
    }, () => {
      if (!cancelled) setRecordState({ requestKey, status: 'error', records: null })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [yearKey, requestKey, recordsProvided])

  const records = recordsProvided ? providedRecords
    : recordState.requestKey === requestKey ? recordState.records : null
  const recordsStatus = recordsProvided ? (records === null ? 'loading' : 'ready')
    : recordState.requestKey === requestKey ? recordState.status : 'loading'
  const result = useMemo(() => {
    if (recordsStatus === 'error' || memberState.status === 'error') {
      return { status: 'error', positions: null, records: null }
    }
    if (recordsStatus !== 'ready' || memberState.status !== 'ready') {
      return { status: 'loading', positions: null, records: null }
    }
    return { status: 'ready', positions: analyzeBestFive(records, memberState.data, month), records }
  }, [records, recordsStatus, memberState, month])

  return { ...result, memberInfo: memberState.data }
}
