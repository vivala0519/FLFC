import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { analyzeScoringStreak } from '../apis/analyzeScoringStreak.js'

const FIRST_RECORD_YEAR = 2021
const EMPTY_RESULT = { name: [], count: 0 }

export default function useScoringStreak(members, asOfDate) {
  const historyCache = useRef(new Map())
  const [result, setResult] = useState({ status: 'loading', ...EMPTY_RESULT })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const currentYear = Number(asOfDate.slice(0, 4))
    setResult({ status: 'loading', ...EMPTY_RESULT })
    if (members.length === 0) return undefined

    const loadYear = (year) => {
      const cache = historyCache.current
      if (!cache.has(year)) {
        const pending = getDocs(collection(db, String(year)))
          .then((snapshot) => snapshot.docs.map((document) => ({
            id: document.id,
            data: document.data(),
          })))
          .catch((error) => {
            cache.delete(year)
            throw error
          })
        cache.set(year, pending)
      }
      return cache.get(year)
    }

    const unsubscribe = onSnapshot(
      collection(db, String(currentYear)),
      async (snapshot) => {
        const currentRevision = ++revision
        setResult({ status: 'loading', ...EMPTY_RESULT })
        try {
          const olderYears = Array.from(
            { length: Math.max(0, currentYear - FIRST_RECORD_YEAR) },
            (_, index) => FIRST_RECORD_YEAR + index,
          )
          const olderRecords = await Promise.all(olderYears.map(async (year) => [
            year, await loadYear(year),
          ]))
          if (cancelled || currentRevision !== revision) return
          const currentRecords = snapshot.docs.map((document) => ({
            id: document.id,
            data: document.data(),
          }))
          const analysis = analyzeScoringStreak({
            ...Object.fromEntries(olderRecords),
            [currentYear]: currentRecords,
          }, members, asOfDate)
          setResult({ status: 'ready', ...analysis })
        } catch {
          if (!cancelled && currentRevision === revision) {
            setResult({ status: 'error', ...EMPTY_RESULT })
          }
        }
      },
      () => {
        revision++
        if (!cancelled) setResult({ status: 'error', ...EMPTY_RESULT })
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [members, asOfDate])

  return result
}
