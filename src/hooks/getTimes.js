import { useAtom } from 'jotai'
import { currentTimeAtom, todayAtom, thisYearAtom, thisMonthAtom, thisDayAtom, thisDateAtom, recordWritableOpenTimeAtom, recordWritableCloseTimeAtom, closeTimeAtom } from '@/store/atoms'

const getTimes = () => {
  const [currentTime] = useAtom(currentTimeAtom)
  const [thisYear] = useAtom(thisYearAtom)
  const [thisMonth] = useAtom(thisMonthAtom)
  const [thisDay] = useAtom(thisDayAtom)
  const [thisDate] = useAtom(thisDateAtom)
  const [today] = useAtom(todayAtom)
  const [recordWritableOpenTime] = useAtom(recordWritableOpenTimeAtom)
  const [recordWritableCloseTime] = useAtom(recordWritableCloseTimeAtom)
  const [closeTime] = useAtom(closeTimeAtom)

  return { currentTime, thisYear, thisMonth, thisDay, thisDate, today, recordWritableOpenTime, recordWritableCloseTime, closeTime }
};

export default getTimes