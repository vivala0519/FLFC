import { useAtom } from 'jotai'
import {
  todaysRealtimeRoundAtom,
  requestListAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
} from '@/store/atoms'

const getRecords = () => {
  const [todaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [todaysRequestList] = useAtom(requestListAtom)
  const [firestoreRecord] = useAtom(firestoreRecordAtom)
  const [statusBoardStat] = useAtom(statusBoardStatAtom)
  const [totalWeeklyTeamData] = useAtom(totalWeeklyTeamDataAtom)
  return {
    todaysRealtimeRound,
    todaysRequestList,
    firestoreRecord,
    statusBoardStat,
    totalWeeklyTeamData,
  }
};

export default getRecords
