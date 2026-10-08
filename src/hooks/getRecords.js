import { useAtom } from 'jotai'
import {
  todaysRealtimeRoundAtom,
  requestListAtom,
  firestoreRecordAtom,
  statusBoardStatAtom,
  totalWeeklyTeamDataAtom,
  gameStatusAtom,
  todaysMVPAtom,
} from '@/store/atoms'

const useRecords = () => {
  const [todaysRealtimeRound] = useAtom(todaysRealtimeRoundAtom)
  const [todaysRequestList] = useAtom(requestListAtom)
  const [firestoreRecord] = useAtom(firestoreRecordAtom)
  const [statusBoardStat] = useAtom(statusBoardStatAtom)
  const [totalWeeklyTeamData] = useAtom(totalWeeklyTeamDataAtom)
  const [gameStatus] = useAtom(gameStatusAtom)
  const [todaysMVP] = useAtom(todaysMVPAtom)
  return {
    todaysRealtimeRound,
    todaysRequestList,
    firestoreRecord,
    statusBoardStat,
    totalWeeklyTeamData,
    gameStatus,
    todaysMVP,
  }
};

export default useRecords
