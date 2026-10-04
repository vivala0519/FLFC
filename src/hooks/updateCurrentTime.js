import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { timeAtom } from '@/store/atoms.js'
import { createCurrentTimeState } from '../apis/currentTimeState.js'

const useUpdateCurrentTime = () => {
  const [, setTime] = useAtom(timeAtom)

  useEffect(() => {
    const updateTime = () => setTime(createCurrentTimeState())
    updateTime()
    const interval = setInterval(() => {
      updateTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [setTime])
}

export default useUpdateCurrentTime
