import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { createAnalysisYearSource } from './analysisYearSource.js'

const recordsFromSnapshot = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, data: document.data() }))
const source = createAnalysisYearSource({
  cacheKey: (year) => `firestore:year:${year}`,
  fetchYear: async (year) => recordsFromSnapshot(await getDocsFromServer(collection(db, year))),
  listenYear: (year, onData, onError) => onSnapshot(collection(db, year), { includeMetadataChanges: true }, (snapshot) => {
    if (!snapshot.metadata.fromCache) onData(recordsFromSnapshot(snapshot))
  }, onError),
  decorate: (records, year, policy) => {
    if (policy.mode !== 'finalized' || year !== policy.year) return records
    const result = records.filter((record) => record.id !== policy.day)
    if (Object.keys(policy.stats || {}).length) result.push({ id: policy.day, data: policy.stats })
    return result.sort((a, b) => a.id.localeCompare(b.id))
  },
})

export const getAnalysisYearRecords = source.get
export const subscribeAnalysisYearRecords = source.subscribe
