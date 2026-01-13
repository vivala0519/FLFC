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
import { collection, getDocs } from 'firebase/firestore'
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
    let cancelled = false

    ;(async () => {
      const year = yearParameter
        ? String(yearParameter)
        : String(thisYear)
      if (firestoreRecord?.[year]) return

      setRecordRoomLoadingFlag(true)
      const colRef = collection(firestoreDb, year)
      const snapshot = await getDocs(colRef)
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))

      if (cancelled) return
      setFirestoreRecord((prev) => ({ ...prev, [year]: fetched }))
      setRecordRoomLoadingFlag(false)
    })().catch(console.error)

    return () => {
      cancelled = true
    }
  }, [
    thisYear,
    yearParameter,
    firestoreRecord,
    setFirestoreRecord,
    setRecordRoomLoadingFlag,
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
      // 1월이면 작년 12월 붙이기 (month는 0이 1월)
      if (thisMonth === 0) {
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
    if (totalWeeklyTeamData) return
    ;(async () => {
      const snapshot = await getDocs(collection(firestoreDb, 'weeklyTeam'))
      const fetchedWeeklyTeamData = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      setWeeklyTeamData(fetchedWeeklyTeamData)
    })().catch(console.error)
  }, [totalWeeklyTeamData, setWeeklyTeamData])
}