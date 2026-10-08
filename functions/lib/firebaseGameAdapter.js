function createFirebaseGameAdapter(admin, logger) {
  const database = admin.database()
  const firestore = admin.firestore()
  const roundsPath = (context) => `${context.year}/${context.today}_rounds`
  const statusPath = (context) => `${context.year}/${context.today}_status`
  const transact = async (path, updater) => {
    const reference = database.ref(path)
    // get() alone does not retain the SDK transaction cache. Keep this subscription alive
    // until the transaction ends so an existing lock or round never starts as local null.
    let cacheListener
    try {
      await new Promise((resolve, reject) => {
        cacheListener = (snapshot) => resolve(snapshot)
        reference.on('value', cacheListener, reject)
      })
      const result = await reference.transaction(updater, undefined, false)
      return { committed: result.committed, value: result.snapshot.val() }
    } finally {
      reference.off('value', cacheListener)
    }
  }
  return {
    async readStatus(context) { return (await database.ref(statusPath(context)).get()).val() },
    async readRounds(context) { return (await database.ref(roundsPath(context)).get()).val() },
    async readWeeklyTeam(context) {
      const snapshot = await firestore.collection('weeklyTeam').doc(context.weeklyTeamId).get()
      return snapshot.exists ? { id: snapshot.id, data: snapshot.data() } : null
    },
    async readMembers() {
      const snapshot = await firestore.collection('members').doc('members').get()
      const data = snapshot.data()
      if (!data || !Array.isArray(data.total) || !Array.isArray(data.retired)) throw new Error('Member information is missing or invalid.')
      return {
        members: data.total.filter((member) => !data.retired.includes(member)),
        oneCharacterMembers: data.oneCharacter || [], nicknames: data.nickName || {},
      }
    },
    transactStatus(context, updater) { return transact(statusPath(context), updater) },
    transactRounds(context, updater) { return transact(roundsPath(context), updater) },
    async writeFinalRecords(context, { stats, bestPlayers }) {
      const batch = firestore.batch()
      batch.set(firestore.collection(context.year).doc(context.today), stats)
      const mvpRef = firestore.collection('daily_mvp').doc(context.weeklyTeamId)
      if (bestPlayers.length) batch.set(mvpRef, { bestPlayers })
      else batch.delete(mvpRef)
      await batch.commit()
    },
    logStatusError(error, context) {
      logger.error('Could not update the failed game finalization status.', { game: context.key, error: error.message })
    },
  }
}

module.exports = { createFirebaseGameAdapter }
