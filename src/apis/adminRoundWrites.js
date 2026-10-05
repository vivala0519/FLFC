import { get, getDatabase, ref, runTransaction } from 'firebase/database'
import { doc, getDocFromServer, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { createAdminRoundStore } from './adminRoundStore.js'

const roundRef = (context) => ref(getDatabase(), `${context.key.slice(0, 4)}/${context.key.slice(4)}_rounds`)

export const adminRoundWrites = createAdminRoundStore({
  readWeeklyTeam: async (context) => {
    const snapshot = await getDocFromServer(doc(db, 'weeklyTeam', context.weeklyTeamId))
    return snapshot.exists() ? { id: snapshot.id, data: snapshot.data() } : null
  },
  readRounds: async (context) => (await get(roundRef(context))).val(),
  transactRounds: (context, updater) => runTransaction(roundRef(context), updater, { applyLocally: false }),
  writeStats: (context, stats) => setDoc(doc(db, context.key.slice(0, 4), context.key.slice(4)), stats),
})
