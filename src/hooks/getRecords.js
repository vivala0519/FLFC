import { useAtom } from 'jotai'
import { realtimeRecordAtom, todaysRealtimeRecordAtom, requestListAtom } from '@/store/atoms'

const getRecords = () => {
  const [realtimeRecord] = useAtom(realtimeRecordAtom)
  const [todaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [todaysRequestList] = useAtom(requestListAtom)
  return { realtimeRecord, todaysRealtimeRecord, todaysRequestList }
};

export default getRecords