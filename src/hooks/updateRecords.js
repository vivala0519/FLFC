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
} from '@/store/atoms'
import { collection, onSnapshot } from 'firebase/firestore'
import { db as firestoreDb } from '../../firebase.js'
import { analyzeForStatusBoard } from '../apis/analyzeData.js'
import { getAnalysisCachePeriod } from '../apis/analysisDataCache.js'
import { getAnalysisYearRecords, subscribeAnalysisYearRecords } from '../apis/analysisYearRecords.js'

export default function useUpdateRecords(yearParameter, setRecordRoomLoadingFlag) {
  const [, setTodaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [, setRequestList] = useAtom(requestListAtom)
  const [firestoreRecord, setFirestoreRecord] = useAtom(firestoreRecordAtom)
  const [statusBoardStat, setStatusBoardStat] = useAtom(statusBoardStatAtom)
  const [totalWeeklyTeamData, setWeeklyTeamData] = useAtom(
    totalWeeklyTeamDataAtom,
  )
  const [existingMembers] = useAtom(existingMembersAtom)
  const [time] = useAtom(timeAtom)

  const { thisYear, thisMonth, currentTime } = time
  const cacheDayKey = getAnalysisCachePeriod(currentTime).dayKey
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
    const unsubscribeRounds = onValue(
      ref(rtdb, `${targetYear}/${targetId}_rounds`),
      (snapshot) => {
        setTodaysRealtimeRound(snapshot.val() || {})
      },
    )
    const unsubscribeRequests = onValue(
      ref(rtdb, `${targetYear}/${targetId}_request`),
      (snapshot) => {
        setRequestList(snapshot.val() || {})
      },
    )

    return () => {
      unsubscribeRounds()
      unsubscribeRequests()
    }
  }, [cacheDayKey, setTodaysRealtimeRound, setRequestList])

  // 2) Firestore year fetch: year별 데이터만 담당

  useEffect(() => {
    const year = yearParameter ? String(yearParameter) : String(thisYear)

    // 로딩 시작
    setRecordRoomLoadingFlag(true)

    const unsubscribe = subscribeAnalysisYearRecords(year, (fetched) => {
      setFirestoreRecord((prev) => ({ ...prev, [year]: fetched }))
      setRecordRoomLoadingFlag(false)
    }, (error) => {
      console.error(error)
      setRecordRoomLoadingFlag(false)
    })

    // 컴포넌트가 언마운트되거나 year가 바뀔 때 리스너를 해제(구독 취소)합니다.
    return () => {
      unsubscribe()
    }
  }, [
    thisYear,
    yearParameter,
    cacheDayKey,
    // firestoreRecord는 의존성 배열에서 빼야 합니다! (무한 루프 방지 및 로직상 불필요)
    setFirestoreRecord,
    setRecordRoomLoadingFlag
  ])

  // 3) StatusBoard 분석: Firestore 데이터가 갱신될 때마다 재계산
  useEffect(() => {
    if (existingMembers.length === 0) return

    const year = yearParameter
      ? String(yearParameter)
      : String(thisYear)
    const yearData = firestoreRecord?.[year]
    if (!yearData) return
    ;(async () => {
      if (thisMonth === 1) {
        const lastYear = String(thisYear - 1)
        const lastDec = (await getAnalysisYearRecords(lastYear))
          .filter((d) => d.id.slice(0, 2) === '12')

        setStatusBoardStat(
          analyzeForStatusBoard([...yearData, ...lastDec], existingMembers),
        )
      } else {
        setStatusBoardStat(analyzeForStatusBoard(yearData, existingMembers))
      }
    })().catch(console.error)
  }, [
    firestoreRecord,
    yearParameter,
    thisYear,
    thisMonth,
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
