import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { getAnalysisCachePeriod, getCachedAnalysisData, setCachedAnalysisData } from './analysisDataCache.js'

const liveYears = new Map()

const recordsFromSnapshot = (snapshot) => snapshot.docs.map((document) => ({
  id: document.id,
  data: document.data(),
}))

const cacheKey = (year) => `firestore:year:${String(year)}`

export const getAnalysisYearRecords = (year) => getCachedAnalysisData(
  cacheKey(year),
  async () => recordsFromSnapshot(await getDocsFromServer(collection(db, String(year)))),
)

// A single listener serves the record room and each analysis hook on Sundays.
// On other days a Monday-or-later snapshot is reused from IndexedDB.
export const subscribeAnalysisYearRecords = (year, onData, onError) => {
  if (!getAnalysisCachePeriod().isSunday) {
    let cancelled = false
    getAnalysisYearRecords(year).then((records) => {
      if (!cancelled) onData(records)
    }).catch((error) => {
      if (!cancelled) onError(error)
    })
    return () => { cancelled = true }
  }

  const key = String(year)
  let live = liveYears.get(key)
  if (!live) {
    live = { subscribers: new Set(), records: null, unsubscribe: null }
    liveYears.set(key, live)
    live.unsubscribe = onSnapshot(collection(db, key), (snapshot) => {
      live.records = recordsFromSnapshot(snapshot)
      void setCachedAnalysisData(cacheKey(key), live.records)
      live.subscribers.forEach((subscriber) => subscriber.onData(live.records))
    }, (error) => {
      live.subscribers.forEach((subscriber) => subscriber.onError(error))
    })
  }

  const subscriber = { onData, onError }
  live.subscribers.add(subscriber)
  if (live.records !== null) onData(live.records)

  return () => {
    live.subscribers.delete(subscriber)
    if (live.subscribers.size === 0) {
      live.unsubscribe()
      liveYears.delete(key)
    }
  }
}
