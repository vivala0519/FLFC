import { useAtom } from 'jotai'
import { currentTimeAtom, todayAtom, thisYearAtom, thisMonthAtom, thisDayAtom, thisDateAtom } from '@/store/atoms'

const getTimes = () => {
  const [currentTime] = useAtom(currentTimeAtom)
  const [thisYear] = useAtom(thisYearAtom)
  const [thisMonth] = useAtom(thisMonthAtom)
  const [thisDay] = useAtom(thisDayAtom)
  const [thisDate] = useAtom(thisDateAtom)
  const [today] = useAtom(todayAtom)

  return { currentTime, thisYear, thisMonth, thisDay, thisDate, today }
};

export default getTimes