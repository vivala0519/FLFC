import { collection, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { createAnalysisYearSource } from './analysisYearSource.js'

const recordsFromSnapshot = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, data: document.data() }))
const source = createAnalysisYearSource({
  cacheKey: () => 'firestore:daily_mvp',
  getRevision: (_, policy) => Object.keys(policy.yearRevisions || {}).length
    ? `${JSON.stringify(Object.entries(policy.yearRevisions).sort())}:${policy.mode === 'finalized' ? policy.revision : ''}`
    : policy.mode === 'finalized' ? `${policy.key}:${policy.revision}` : undefined,
  fetchYear: async () => recordsFromSnapshot(await getDocsFromServer(collection(db, 'daily_mvp'))),
  listenYear: (_, onData, onError) => onSnapshot(collection(db, 'daily_mvp'), { includeMetadataChanges: true }, (snapshot) => {
    if (!snapshot.metadata.fromCache) onData(recordsFromSnapshot(snapshot))
  }, onError),
  decorate: (records, _, policy) => {
    if (policy.mode !== 'finalized' || !Array.isArray(policy.bestPlayers)) return records
    return [...records.filter((record) => record.id !== policy.weeklyTeamId),
      { id: policy.weeklyTeamId, data: { bestPlayers: policy.bestPlayers } }]
  },
})

export const subscribeAnalysisMvpRecords = (onData, onError) => source.subscribe('all', onData, onError)
