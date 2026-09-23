import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { analyzeRecentForm, getRecentFormCutoff } from '../apis/analyzeRecentForm.js'

const EMPTY_RESULT = { leaders: [], decliners: [], eligibleCount: 0 }
const FIRST_RECORD_YEAR = 2021

export default function useRecentForm(members, asOfDate) {
  const historyCache = useRef(new Map())
  const [result, setResult] = useState({ status: 'loading', ...EMPTY_RESULT })

  useEffect(() => {
    let cancelled = false
    let revision = 0
    const currentYear = Number(asOfDate.slice(0, 4))
    const earliestRelevantYear = Math.max(FIRST_RECORD_YEAR, Number(getRecentFormCutoff(asOfDate).slice(0, 4)))

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
        const isCurrent = () => !cancelled && currentRevision === revision
        setResult({ status: 'loading', ...EMPTY_RESULT })

        try {
          const recordsByYear = {
            [currentYear]: snapshot.docs.map((document) => ({
              id: document.id,
              data: document.data(),
            })),
          }
          let analysis = analyzeRecentForm(recordsByYear, members, asOfDate)

          for (
            let year = currentYear - 1;
            year >= earliestRelevantYear && analysis.missingMembers.length > 0;
            year--
          ) {
            recordsByYear[year] = await loadYear(year)
            if (!isCurrent()) return
            analysis = analyzeRecentForm(recordsByYear, members, asOfDate)
          }

          if (isCurrent()) {
            setResult({
              status: 'ready',
              leaders: analysis.leaders,
              decliners: analysis.decliners,
              eligibleCount: analysis.eligibleCount,
            })
          }
        } catch {
          if (isCurrent()) setResult({ status: 'error', ...EMPTY_RESULT })
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
