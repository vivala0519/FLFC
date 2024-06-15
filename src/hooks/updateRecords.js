import {useEffect} from 'react'
import { useAtom } from 'jotai'
import {getDatabase, onValue, ref} from 'firebase/database'
import { realtimeRecordAtom, todaysRealtimeRecordAtom, requestListAtom, timeAtom } from '@/store/atoms'

const updateRecords = () => {
  const [, setRealtimeRecord] = useAtom(realtimeRecordAtom)
  const [, setTodaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [, setRequestList] = useAtom(requestListAtom)
  const [time] = useAtom(timeAtom)
  const { thisYear, today } = time

  useEffect(() => {
    const db = getDatabase()
    const todayRef = ref(db, thisYear + '/')
    onValue(todayRef, (snapshot) => {
      const realTimeRecord = snapshot.val()
      setRealtimeRecord(realTimeRecord)
      setTodaysRealtimeRecord(realTimeRecord[today] || {})
      setRequestList(realTimeRecord[today + '_request'] || {})
    })

  }, [setRealtimeRecord, setTodaysRealtimeRecord, thisYear, today])
};
export default updateRecords