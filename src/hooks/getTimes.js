import { useAtom } from 'jotai'
import { timeAtom } from '@/store/atoms'

const getTimes = () => {
  const [time] = useAtom(timeAtom)

  return { time }
};

export default getTimes