import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { timeAtom } from '@/store/atoms.js'

const updateCurrentTime = () => {
  const [, setTime] = useAtom(timeAtom)

  const setCurrentTime = (newTime) => {
    setTime(oldTime => ({ ...oldTime, currentTime: newTime }))
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000);

    return () => clearInterval(interval)
  }, [setCurrentTime])
};

export default updateCurrentTime