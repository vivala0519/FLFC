import { get, getDatabase, ref, runTransaction } from 'firebase/database'
import { doc, getDocFromServer, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { createAdminRoundStore } from './adminRoundStore.js'
import { getAdminMatchContext } from './adminRoundDraft.js'

const roundRef = (context) => ref(getDatabase(), `${context.key.slice(0, 4)}/${context.key.slice(4)}_rounds`)

export const adminRoundWrites = createAdminRoundStore({
  readWeeklyTeam: async (context) => {
    const snapshot = await getDocFromServer(doc(db, 'weeklyTeam', context.weeklyTeamId))
    return snapshot.exists() ? { id: snapshot.id, data: snapshot.data() } : null
  },
  readRounds: async (context) => (await get(roundRef(context))).val(),
  transactRounds: (context, updater) => runTransaction(roundRef(context), updater, { applyLocally: false }),
  writeStats: (context, stats) => {
    const actual = getAdminMatchContext(new Date())
    if (!actual.canEdit || actual.key !== context.key) throw new Error('경기가 종료되어 서버에서 최종 집계합니다.')
    return setDoc(doc(db, context.key.slice(0, 4), context.key.slice(4)), stats)
  },
})
