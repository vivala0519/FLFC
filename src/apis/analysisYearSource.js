import { getCachedAnalysisData, setCachedAnalysisData } from './analysisDataCache.js'
import { getRecordReadPolicy, subscribeRecordReadPolicy, waitForRecordReadPolicy } from './recordReadPolicy.js'

export function getYearCacheRevision(year, policy) {
  const version = policy.yearRevisions?.[year]
  const match = policy.mode === 'finalized' ? `${policy.key}:${policy.revision}` : undefined
  if (version) return `year:${version}${String(year) === policy.year && match ? `:${match}` : ''}`
  return match
}

// Share live listeners and revision-based reads across stats, rounds and MVP consumers.
export function createAnalysisYearSource({ cacheKey, fetchYear, listenYear,
  decorate = (data) => data, getRevision = getYearCacheRevision }) {
  const sources = new Map()
  const load = async (year, policy, previous) => {
    const data = await getCachedAnalysisData(cacheKey(year), async () => decorate(previous || await fetchYear(year), year, policy), {
      revision: getRevision(year, policy), staleOnError: !getRevision(year, policy),
    })
    return decorate(data, year, policy)
  }
  const restart = (year, source, policy) => {
    source.ready = false
    source.unsubscribe?.()
    source.unsubscribe = undefined
    const generation = ++source.generation
    if (!policy || policy.mode === 'loading') return
    const previousKey = source.policyKey
    const previousMode = source.mode
    if (previousKey !== policy.key) source.fromServer = false
    source.policyKey = policy.key
    source.mode = policy.mode
    const publish = (data) => {
      if (generation !== source.generation) return
      source.data = data
      source.ready = true
      source.subscribers.forEach((subscriber) => subscriber.onData(data))
    }
    const fail = (error) => {
      if (generation === source.generation) source.subscribers.forEach((subscriber) => subscriber.onError?.(error))
    }
    if (policy.mode === 'live') {
      source.unsubscribe = listenYear(year, (data) => {
        if (generation !== source.generation) return
        void setCachedAnalysisData(cacheKey(year), data)
        source.fromServer = true
        publish(data)
      }, fail)
    } else {
      const previous = policy.mode === 'finalized' && previousMode === 'live'
        && previousKey === policy.key && source.fromServer ? source.data : undefined
      void load(year, policy, previous).then(publish).catch(fail)
    }
  }
  subscribeRecordReadPolicy((policy) => {
    for (const [year, source] of sources) restart(year, source, policy)
  })
  return {
    get: async (year) => load(String(year), await waitForRecordReadPolicy()),
    subscribe: (year, onData, onError) => {
      const key = String(year)
      let source = sources.get(key)
      const isNew = !source
      if (!source) {
        source = { subscribers: new Set(), data: null, unsubscribe: null, generation: 0, fromServer: false, ready: false }
        sources.set(key, source)
      }
      const subscriber = { onData, onError }
      source.subscribers.add(subscriber)
      if (isNew) restart(key, source, getRecordReadPolicy())
      else if (source.ready) onData(source.data)
      return () => {
        source.subscribers.delete(subscriber)
        if (source.subscribers.size === 0) {
          source.generation++
          source.unsubscribe?.()
          sources.delete(key)
        }
      }
    },
  }
}
