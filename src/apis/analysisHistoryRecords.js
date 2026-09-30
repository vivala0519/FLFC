import { collection, getDocsFromServer } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { getCachedAnalysisData } from './analysisDataCache.js'

export const getAnalysisHistoryRecords = () => getCachedAnalysisData('firestore:history', async () => {
  const snapshot = await getDocsFromServer(collection(db, 'history'))
  return snapshot.docs.map((document) => ({ id: document.id, data: document.data() }))
})
