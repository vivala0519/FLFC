import { useAtom } from 'jotai'
import { realtimeRecordAtom, todaysRealtimeRecordAtom, todaysRealtimeRoundAtom, requestListAtom } from '@/store/atoms'

const getRecords = () => {
  const [realtimeRecord] = useAtom(realtimeRecordAtom)
  const [todaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [todaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [todaysRequestList] = useAtom(requestListAtom)
  return { realtimeRecord, todaysRealtimeRecord, todaysRealtimeRound, todaysRequestList }
};

export default getRecords