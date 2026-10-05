import { useEffect, useMemo, useRef } from 'react'
import { useAtom } from 'jotai'
import {
  todaysRealtimeRoundAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
  existingMembersAtom,
  timeAtom,
  matchSessionAtom,
} from '@/store/atoms'
import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { db as firestoreDb } from '../../firebase.js'
import { analyzeForStatusBoard } from '../apis/analyzeData.js'
import { getAnalysisCachePeriod, getCachedAnalysisData, setCachedAnalysisData } from '../apis/analysisDataCache.js'
import { subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'
import { getMatchTarget, subscribeMatchRecords } from '../apis/matchRecords.js'
import { setRecordReadPolicy } from '../apis/recordReadPolicy.js'

export default function useUpdateRecords(yearParameter, setRecordRoomLoadingFlag) {
  const [, setTodaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [matchSession, setMatchSession] = useAtom(matchSessionAtom)
  const weeklySource = useRef(null)
  const [firestoreRecord, setFirestoreRecord] = useAtom(firestoreRecordAtom)
  const [, setStatusBoardStat] = useAtom(statusBoardStatAtom)
  const [, setWeeklyTeamData] = useAtom(
    totalWeeklyTeamDataAtom,
  )
  const [existingMembers] = useAtom(existingMembersAtom)
  const [time] = useAtom(timeAtom)

  const { thisYear, thisMonth, currentTime } = time
  const cacheDayKey = getAnalysisCachePeriod(currentTime).dayKey
  const target = useMemo(() => getMatchTarget(`${cacheDayKey}T12:00:00+09:00`), [cacheDayKey])
  const selectedYear = String(yearParameter || thisYear)
  const currentYearRecords = firestoreRecord?.[thisYear]
  const previousYear = String(Number(thisYear) - 1)
  const previousYearRecords = firestoreRecord?.[previousYear]
  // A server-confirmed archive replaces the live connection after the final commit.
  useEffect(() => {
    setTodaysRealtimeRound(null)
    setMatchSession({ ...target, status: 'loading' })
    setRecordReadPolicy({ ...target, mode: 'loading' })
    return subscribeMatchRecords(target, (next) => {
      setMatchSession((previous) => ({ ...previous, ...next }))
      if (next.rounds !== undefined) setTodaysRealtimeRound(next.rounds)
      if (next.status) {
        const mode = next.status === 'finalized' ? 'finalized' : next.status === 'legacy' ? 'legacy' : 'live'
        setRecordReadPolicy({ ...target, mode, revision: next.revision, stats: next.stats,
          rounds: next.rounds, bestPlayers: next.bestPlayers, yearRevisions: next.yearRevisions })
      }
    }, (error) => {
      console.error('Failed to load match session:', error)
      setMatchSession((previous) => ({ ...previous, status: 'error', error: error.message }))
      setTodaysRealtimeRound((previous) => previous || {})
      setRecordReadPolicy({ ...target, mode: target.isCurrentSunday ? 'live' : 'legacy' })
    })
  }, [target, setTodaysRealtimeRound, setMatchSession])

  // 2) Firestore year fetch: year별 데이터만 담당

  useEffect(() => {
    setRecordRoomLoadingFlag(true)
    const years = [...new Set([String(thisYear), selectedYear, ...(thisMonth === 1 ? [previousYear] : [])])]
    const unsubscribers = years.map((year) => subscribeAnalysisYearRecords(year, (fetched) => {
      setFirestoreRecord((previous) => ({ ...previous, [year]: fetched }))
      if (year === selectedYear) setRecordRoomLoadingFlag(false)
    }, (error) => {
      console.error(error)
      if (year === selectedYear) setRecordRoomLoadingFlag(false)
    }))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [
    thisYear,
    thisMonth,
    previousYear,
    selectedYear,
    cacheDayKey,
    setFirestoreRecord,
    setRecordRoomLoadingFlag
  ])

  // 3) StatusBoard 분석: Firestore 데이터가 갱신될 때마다 재계산
  useEffect(() => {
    if (existingMembers.length === 0) return

    if (!currentYearRecords) return
    const lastDecember = thisMonth === 1
      ? (previousYearRecords || []).filter((record) => record.id.slice(0, 2) === '12')
      : []
    const recentAttendanceRecords = [...currentYearRecords, ...lastDecember]
    let analyzed = analyzeForStatusBoard(currentYearRecords, existingMembers, undefined, thisYear, recentAttendanceRecords)
    if (thisMonth === 1 && analyzed.active.totalData.size === 0 && previousYearRecords) {
      analyzed = analyzeForStatusBoard(previousYearRecords, existingMembers, 4, previousYear, recentAttendanceRecords)
    }
    setStatusBoardStat(analyzed)
  }, [
    currentYearRecords,
    previousYearRecords,
    previousYear,
    thisYear,
    thisMonth,
    cacheDayKey,
    existingMembers,
    setStatusBoardStat,
  ])

  const sessionMode = matchSession.status === 'loading' ? 'loading'
    : matchSession.status === 'finalized' ? 'finalized' : matchSession.status === 'legacy' ? 'legacy' : 'live'

  // Weekly-team editing has its own listener only while that tab is open.
  useEffect(() => {
    if (sessionMode === 'loading' || matchSession.key !== target.key) return
    let cancelled = false
    const toRecords = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, data: document.data() }))
    if (sessionMode === 'live') {
      return onSnapshot(collection(firestoreDb, 'weeklyTeam'), { includeMetadataChanges: true }, (snapshot) => {
        if (snapshot.metadata.fromCache) return
        const records = toRecords(snapshot)
        weeklySource.current = { key: target.key, records }
        setWeeklyTeamData(records)
        void setCachedAnalysisData('firestore:weeklyTeam', records)
      }, console.error)
    }
    const revision = sessionMode === 'finalized' ? `${target.key}:${matchSession.revision}` : undefined
    void getCachedAnalysisData('firestore:weeklyTeam', async () => {
      let records = sessionMode === 'finalized' && weeklySource.current?.key === target.key
        ? weeklySource.current.records : toRecords(await getDocsFromServer(collection(firestoreDb, 'weeklyTeam')))
      const weeklyTeam = matchSession.weeklyTeam
      if (sessionMode === 'finalized' && weeklyTeam && Object.keys(weeklyTeam.data || {}).length) {
        records = [...records.filter((record) => record.id !== weeklyTeam.id), weeklyTeam].sort((a, b) => a.id.localeCompare(b.id))
      }
      return records
    }, { revision, staleOnError: sessionMode !== 'finalized' }).then((records) => {
      if (!cancelled) setWeeklyTeamData(records)
    }).catch(console.error)
    return () => { cancelled = true }
  }, [target.key, sessionMode, matchSession.revision, matchSession.key, matchSession.weeklyTeam, setWeeklyTeamData])
}
