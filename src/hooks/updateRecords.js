import { useEffect } from 'react'
import { getDatabase, onValue, ref } from 'firebase/database'
import { useAtom } from 'jotai'
import {
  realtimeRecordAtom,
  todaysRealtimeRecordAtom,
  todaysRealtimeRoundAtom,
  requestListAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
  timeAtom,
} from '@/store/atoms'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db as firestoreDb } from '../../firebase.js'
import { analyzeForStatusBoard } from '../apis/analyzeData.js'

export default function useUpdateRecords(yearParameter, setRecordRoomLoadingFlag) {
  const [, setRealtimeRecord] = useAtom(realtimeRecordAtom)
  const [, setTodaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [, setTodaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [, setRequestList] = useAtom(requestListAtom)
  const [firestoreRecord, setFirestoreRecord] = useAtom(firestoreRecordAtom)
  const [statusBoardStat, setStatusBoardStat] = useAtom(statusBoardStatAtom)
  const [totalWeeklyTeamData, setWeeklyTeamData] = useAtom(
    totalWeeklyTeamDataAtom,
  )
  const [time] = useAtom(timeAtom)

  const { thisYear, thisMonth, thisDay, today, currentTime } = time
  // 1) RTDB subscribe: 구독만 담당
  useEffect(() => {
    const rtdb = getDatabase()
    const todayRef = ref(rtdb, `${thisYear}/`)
    const lastYearRef = ref(rtdb, `${thisYear - 1}/`)

    const dateToId = (d) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

    const getTargetId = (date) => {
      if (thisDay === 0 || thisDay === 6) return today
      const sunday = new Date(date)
      sunday.setDate(date.getDate() - thisDay)
      return dateToId(sunday)
    }

    const targetId = getTargetId(currentTime)
    const useLastYear =
      targetId.slice(0, 2) === '12' && today.slice(0, 2) === '01'

    const unsubscribe = onValue(
      useLastYear ? lastYearRef : todayRef,
      (snapshot) => {
        const realTimeRecord = snapshot.val() || {}
        setRealtimeRecord(realTimeRecord)
        setTodaysRealtimeRecord(realTimeRecord[targetId] || {})
        setTodaysRealtimeRound(realTimeRecord[`${targetId}_rounds`] || {})
        setRequestList(realTimeRecord[`${targetId}_request`] || {})
      },
    )

    return () => unsubscribe()
  }, [
    thisYear,
    today,
    thisDay,
    setRealtimeRecord,
    setTodaysRealtimeRecord,
    setTodaysRealtimeRound,
    setRequestList,
  ])

  // 2) Firestore year fetch: year별 데이터만 담당

  useEffect(() => {
    const year = yearParameter ? String(yearParameter) : String(thisYear)

    // 로딩 시작
    setRecordRoomLoadingFlag(true)

    const colRef = collection(firestoreDb, year)

    // onSnapshot은 리스너(구독)를 등록합니다. 데이터가 변할 때마다 실행됩니다.
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))

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
    // firestoreRecord는 의존성 배열에서 빼야 합니다! (무한 루프 방지 및 로직상 불필요)
    setFirestoreRecord,
    setRecordRoomLoadingFlag
  ])

  // 3) StatusBoard 분석: “데이터 준비되면 1번”만
  useEffect(() => {
    if (statusBoardStat) return

    const year = yearParameter
      ? String(yearParameter)
      : String(thisYear)
    const yearData = firestoreRecord?.[year]
    if (!yearData) return
    ;(async () => {
      if (thisMonth === 1) {
        const lastYear = String(thisYear - 1)
        const snapshot = await getDocs(collection(firestoreDb, lastYear))
        const lastDec = snapshot.docs
          .map((doc) => ({ id: doc.id, data: doc.data() }))
          .filter((d) => d.id.slice(0, 2) === '12')

        setStatusBoardStat(analyzeForStatusBoard([...yearData, ...lastDec]))
      } else {
        setStatusBoardStat(analyzeForStatusBoard(yearData))
      }
    })().catch(console.error)
  }, [
    statusBoardStat,
    firestoreRecord,
    yearParameter,
    thisYear,
    thisMonth,
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