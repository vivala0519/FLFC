import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { analyzeBestFive } from '../apis/analyzeBestFive.js'
import { analyzeCleanSheets } from '../apis/analyzeCleanSheets.js'
import { subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

export default function useBestFive(year, month, cacheDayKey, providedRecords, cleanSheetSource = {}) {
  const { yearRoundData, roundStatus, weeklyTeams, members, oneCharacterMembers, nicknames, asOfDate } = cleanSheetSource
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
    if (recordsStatus === 'error' || memberState.status === 'error' || roundStatus === 'error') {
      return { status: 'error', positions: null, records: null, cleanSheets: null }
    }
    if (recordsStatus !== 'ready' || memberState.status !== 'ready' || roundStatus !== 'ready' ||
      !yearRoundData || !Array.isArray(weeklyTeams) || !Array.isArray(members) || members.length === 0) {
      return { status: 'loading', positions: null, records: null, cleanSheets: null }
    }
    const cleanSheets = analyzeCleanSheets({
      roundYears: { [yearKey]: yearRoundData }, weeklyTeams, memberInfo: memberState.data,
      members, oneCharacterMembers, nicknames, asOfDate,
    })
    const counts = cleanSheets.seasons.get(`${yearKey}-${Math.ceil(month / 3)}`) || new Map()
    return { status: 'ready', positions: analyzeBestFive(records, memberState.data, month, counts), records, cleanSheets }
  }, [records, recordsStatus, memberState, month, yearKey, yearRoundData, roundStatus,
    weeklyTeams, members, oneCharacterMembers, nicknames, asOfDate])

  return { ...result, memberInfo: memberState.data }
}
