import { useEffect } from 'react'
import { getDatabase, onValue, ref } from 'firebase/database'
import { useAtom } from 'jotai'
import {
  todaysRealtimeRoundAtom,
  requestListAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
  existingMembersAtom,
  timeAtom,
  gameStatusAtom,
  todaysMVPAtom,
} from '@/store/atoms'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db as firestoreDb } from '../../firebase.js'
import { analyzeForStatusBoard } from '../apis/analyzeData.js'
import { getAnalysisCachePeriod } from '../apis/analysisDataCache.js'
import { subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

export default function useUpdateRecords(yearParameter, setRecordRoomLoadingFlag) {
  const [, setTodaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [, setRequestList] = useAtom(requestListAtom)
  const [firestoreRecord, setFirestoreRecord] = useAtom(firestoreRecordAtom)
  const [, setStatusBoardStat] = useAtom(statusBoardStatAtom)
  const [, setWeeklyTeamData] = useAtom(
    totalWeeklyTeamDataAtom,
  )
  const [existingMembers] = useAtom(existingMembersAtom)
  const [time] = useAtom(timeAtom)
  const [, setGameStatus] = useAtom(gameStatusAtom)
  const [, setTodaysMVP] = useAtom(todaysMVPAtom)

  const { thisYear, thisMonth, currentTime } = time
  const cacheDayKey = getAnalysisCachePeriod(currentTime).dayKey
  const selectedYear = String(yearParameter || thisYear)
  const currentYearRecords = firestoreRecord?.[thisYear]
  const previousYear = String(Number(thisYear) - 1)
  const previousYearRecords = firestoreRecord?.[previousYear]
  // 1) RTDB subscribe: 구독만 담당
  useEffect(() => {
    const rtdb = getDatabase()
    const [year, month, day] = cacheDayKey.split('-').map(Number)
    const targetDate = new Date(Date.UTC(year, month - 1, day))
    const weekday = targetDate.getUTCDay()
    if (weekday !== 0 && weekday !== 6) {
      targetDate.setUTCDate(targetDate.getUTCDate() - weekday)
    }
    const targetId = `${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}${String(targetDate.getUTCDate()).padStart(2, '0')}`
    const targetYear = String(targetDate.getUTCFullYear())
    const context = { year: targetYear, day: targetId, loaded: false, data: null }
    let active = true
    setGameStatus(context)
    setTodaysMVP(context)
    const unsubscribeRounds = onValue(
      ref(rtdb, `${targetYear}/${targetId}_rounds`),
      (snapshot) => {
        if (!active) return
        setTodaysRealtimeRound(snapshot.val() || {})
      },
    )
    const unsubscribeRequests = onValue(
      ref(rtdb, `${targetYear}/${targetId}_request`),
      (snapshot) => {
        if (!active) return
        setRequestList(snapshot.val() || {})
      },
    )
    const unsubscribeStatus = onValue(
      ref(rtdb, `${targetYear}/${targetId}_status`),
      (snapshot) => {
        if (!active) return
        setGameStatus({ ...context, loaded: true, data: snapshot.val() })
      },
      (error) => {
        if (!active) return
        setGameStatus(context)
        console.error('경기 종료 상태를 가져오는 중 에러 발생:', error)
      },
    )
    const mvpDocumentId = `${targetYear.slice(-2)}${targetId}`
    const unsubscribeMVP = onSnapshot(
      doc(firestoreDb, 'daily_mvp', mvpDocumentId),
      (snapshot) => {
        if (!active) return
        setTodaysMVP({ ...context, loaded: true, data: snapshot.exists() ? snapshot.data() : null })
      },
      (error) => {
        if (!active) return
        setTodaysMVP(context)
        console.error('오늘의 MVP를 가져오는 중 에러 발생:', error)
      },
    )

    return () => {
      active = false
      unsubscribeRounds()
      unsubscribeRequests()
      unsubscribeStatus()
      unsubscribeMVP()
    }
  }, [cacheDayKey, setTodaysRealtimeRound, setRequestList, setGameStatus, setTodaysMVP])

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

  // 4) weeklyTeam: 1회 fetch
  useEffect(() => {
    // 1. onSnapshot을 사용하여 실시간 리스너 설정
    const unsubscribe = onSnapshot(
        collection(firestoreDb, 'weeklyTeam'),
        (snapshot) => {
          const fetchedWeeklyTeamData = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          }))

          // 데이터가 변경될 때마다 state 업데이트
          setWeeklyTeamData(fetchedWeeklyTeamData)
        },
        (error) => {
          console.error('실시간 데이터를 가져오는 중 에러 발생:', error)
        }
    )

    // 2. 컴포넌트가 언마운트될 때 리스너 해제 (메모리 누수 방지)
    return () => unsubscribe()
  }, [setWeeklyTeamData])
}
