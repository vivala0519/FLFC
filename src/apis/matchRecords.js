import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore'
import { get, getDatabase, onValue, ref } from 'firebase/database'
import { db } from '../../firebase.js'
import { getCachedAnalysisData } from './analysisDataCache.js'
import { subscribeMatch } from './matchSubscription.js'

export { getMatchTarget } from '../../functions/lib/matchDate.mjs'

export function subscribeMatchRecords(target, onData, onError) {
  const stateRef = doc(db, 'matchFinalizations', target.key)
  const roundsRef = ref(getDatabase(), `${target.year}/${target.day}_rounds`)
  let yearRevisions = {}
  let initiallyFinalized = false
  const readVersions = async () => {
    yearRevisions = (await getDocFromServer(doc(db, 'recordCacheVersions', 'years'))).data()?.revisions || {}
  }
  return subscribeMatch(target, {
    readState: async () => {
      const [snapshot] = await Promise.all([getDocFromServer(stateRef), readVersions()])
      const state = snapshot.data()
      initiallyFinalized = state?.status === 'finalized'
      return state
    },
    listenState: (onState, onFailure) => onSnapshot(stateRef, { includeMetadataChanges: true }, (snapshot) => {
      // Cached metadata is not proof that the server has finished saving.
      if (!snapshot.metadata.fromCache) onState(snapshot.data())
    }, onFailure),
    listenRounds: (onRounds, onFailure) => onValue(roundsRef, (snapshot) => onRounds(snapshot.val() || {}), onFailure),
    loadFinalArchive: async (revision) => {
      if (!initiallyFinalized) await readVersions()
      return getCachedAnalysisData(`match:${target.key}`, async () => {
        const archive = (await getDocFromServer(doc(db, 'matchArchives', target.key))).data()
        if (archive?.revision !== revision) throw new Error('Final archive is missing or has changed; refresh to retry')
        return archive
      }, { revision, staleOnError: false })
    },
    loadLegacyArchive: () => getCachedAnalysisData(`match:legacy:${target.key}`, async () => {
      const rounds = (await get(roundsRef)).val() || {}
      const weekly = await getDocFromServer(doc(db, 'weeklyTeam', target.weeklyTeamId))
      const stats = await getDocFromServer(doc(db, target.year, target.day))
      return { rounds, weeklyTeam: { id: target.weeklyTeamId, data: weekly.data() || {} }, stats: stats.data() || {} }
    }, { staleOnError: true }),
  }, (data) => onData({ ...data, yearRevisions }), onError)
}
