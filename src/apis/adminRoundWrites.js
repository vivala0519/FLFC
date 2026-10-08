import { get, getDatabase, ref, runTransaction } from 'firebase/database'
import { doc, getDocFromServer, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { createAdminRoundStore } from './adminRoundStore.js'

const roundRef = (context) => ref(getDatabase(), `${context.key.slice(0, 4)}/${context.key.slice(4)}_rounds`)

export const adminRoundWrites = createAdminRoundStore({
  readStats: async (context) => {
    const snapshot = await getDocFromServer(doc(db, context.key.slice(0, 4), context.key.slice(4)))
    return snapshot.exists() ? snapshot.data() : {}
  },
  readGameStatus: async (context) => (await get(ref(getDatabase(), `${context.key.slice(0, 4)}/${context.key.slice(4)}_status`))).val(),
  readRounds: async (context) => (await get(roundRef(context))).val(),
  transactRounds: (context, updater) => runTransaction(roundRef(context), updater, { applyLocally: false }),
  writeStats: (context, stats) => setDoc(doc(db, context.key.slice(0, 4), context.key.slice(4)), stats),
})
