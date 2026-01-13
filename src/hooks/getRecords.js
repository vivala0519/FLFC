import { useAtom } from 'jotai'
import {
  realtimeRecordAtom,
  todaysRealtimeRecordAtom,
  todaysRealtimeRoundAtom,
  requestListAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
} from '@/store/atoms'

const getRecords = () => {
  const [realtimeRecord] = useAtom(realtimeRecordAtom)
  const [todaysRealtimeRecord] = useAtom(todaysRealtimeRecordAtom)
  const [todaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [todaysRequestList] = useAtom(requestListAtom)
  const [firestoreRecord] = useAtom(firestoreRecordAtom)
  const [statusBoardStat] = useAtom(statusBoardStatAtom)
  const [totalWeeklyTeamData] = useAtom(totalWeeklyTeamDataAtom)
  return {
    realtimeRecord,
    todaysRealtimeRecord,
    todaysRealtimeRound,
    todaysRequestList,
    firestoreRecord,
    statusBoardStat,
    totalWeeklyTeamData,
  }
};

export default getRecords