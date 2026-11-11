import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'flfc:career-ranking-hint-clicks:v1'
const CLICK_LIMIT = 3

const readClickCount = () => {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(value) && value >= 0 ? Math.min(value, CLICK_LIMIT) : 0
  } catch {
    return 0
  }
}

const useCareerClickHint = () => {
  const [clickCount, setClickCount] = useState(readClickCount)
  const countRef = useRef(clickCount)

  useEffect(() => {
    const onStorageChange = (event) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return
      const count = readClickCount()
      countRef.current = count
      setClickCount(count)
    }
    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  const recordClick = useCallback(() => {
    const count = Math.min(CLICK_LIMIT, Math.max(countRef.current, readClickCount()) + 1)
    countRef.current = count
    setClickCount(count)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(count))
    } catch {
      // The hint still dismisses during this visit when storage is unavailable.
    }
  }, [])

  return { showHint: clickCount < CLICK_LIMIT, recordClick }
}

export default useCareerClickHint
