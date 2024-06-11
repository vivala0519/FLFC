import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { currentTimeAtom } from '../store/atoms.js'

const updateCurrentTime = () => {
  const [, setCurrentTime] = useAtom(currentTimeAtom)


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000);

    return () => clearInterval(interval)
  }, [setCurrentTime])
};

export default updateCurrentTime