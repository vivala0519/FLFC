import { get, getDatabase, onValue, ref } from 'firebase/database'
import { createAnalysisYearSource } from './analysisYearSource.js'

const source = createAnalysisYearSource({
  cacheKey: (year) => `rtdb:${year}`,
  fetchYear: async (year) => (await get(ref(getDatabase(), year))).val() || {},
  listenYear: (year, onData, onError) => onValue(ref(getDatabase(), year), (snapshot) => onData(snapshot.val() || {}), onError),
  decorate: (rounds, year, policy) => {
    if (policy.mode !== 'finalized' || year !== policy.year || !policy.rounds) return rounds
    const result = { ...rounds }
    const key = `${policy.day}_rounds`
    if (Object.keys(policy.rounds).length) result[key] = policy.rounds
    else delete result[key]
    return result
  },
})

export const getAnalysisYearRounds = source.get
export const subscribeAnalysisYearRounds = source.subscribe
