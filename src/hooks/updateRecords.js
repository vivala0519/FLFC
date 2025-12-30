import {useEffect} from 'react'
import {getDatabase, onValue, ref} from 'firebase/database'
import { useAtom } from 'jotai'
import { realtimeRecordAtom, todaysRealtimeRecordAtom, todaysRealtimeRoundAtom, requestListAtom, timeAtom } from '@/store/atoms'

const updateRecords = () => {
  const [, setRealtimeRecord] = useAtom(realtimeRecordAtom)
  const [, setTodaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [, setTodaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [, setRequestList] = useAtom(requestListAtom)
  const [time] = useAtom(timeAtom)
  const { thisYear, today, thisDay, currentTime } = time

  useEffect(() => {
    const db = getDatabase()
    const todayRef = ref(db, thisYear + '/')
    const lastYearRef = ref(db, thisYear - 1 + '/')
    const dateToId = (d) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

    const getTargetId = (date) => {
      const day = thisDay

      // 토/일이면 오늘 id 그대로
      if (thisDay === 0 || thisDay === 6) return today

      // 그 외(월~금): 지난 일요일로 이동
      const sunday = new Date(date)
      sunday.setDate(date.getDate() - day) // day(1~5)만큼 빼면 일요일
      return dateToId(sunday)
    }
    const targetId = getTargetId(currentTime)
    if (targetId.slice(0, 2) === '12' && today.slice(0, 2) === '01') {
      onValue(lastYearRef, (snapshot) => {
        const realTimeRecord = snapshot.val()
        setRealtimeRecord(realTimeRecord)
        setTodaysRealtimeRecord(realTimeRecord[targetId] || {})
        setTodaysRealtimeRound(realTimeRecord[targetId + '_rounds'] || {})
        setRequestList(realTimeRecord[targetId + '_request'] || {})
      })
    } else {
      onValue(todayRef, (snapshot) => {
        const realTimeRecord = snapshot.val()
        setRealtimeRecord(realTimeRecord)
        setTodaysRealtimeRecord(realTimeRecord[targetId] || {})
        setTodaysRealtimeRound(realTimeRecord[targetId + '_rounds'] || {})
        setRequestList(realTimeRecord[targetId + '_request'] || {})
      })
    }
  }, [setRealtimeRecord, setTodaysRealtimeRecord, thisYear, today])
};
export default updateRecords