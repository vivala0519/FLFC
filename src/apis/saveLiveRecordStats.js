import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../../firebase.js'

export async function saveLiveRecordStats(year, day, stats) {
  if (!stats || !Object.keys(stats).length) return false
  return runTransaction(db, async (transaction) => {
    const state = (await transaction.get(doc(db, 'matchFinalizations', `${year}${day}`))).data()
    if (['finalizing', 'finalized'].includes(state?.status)) return false
    transaction.set(doc(db, year, day), stats)
    return true
  })
}
