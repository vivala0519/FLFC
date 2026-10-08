const { onSchedule } = require('firebase-functions/v2/scheduler')
const logger = require('firebase-functions/logger')

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { createGameFinalizer } = require('./lib/finalizeGame.js')
const { createFirebaseGameAdapter } = require('./lib/firebaseGameAdapter.js')

admin.initializeApp()

const finalizeGame = createGameFinalizer(createFirebaseGameAdapter(admin, logger))

exports.finalizeSundayGame = onSchedule({
  schedule: '0 10 * * 0',
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
  retryCount: 10,
  minBackoffSeconds: 60,
  maxBackoffSeconds: 600,
  maxRetrySeconds: 3600,
  timeoutSeconds: 240,
  memory: '256MiB',
}, async (event) => {
  const result = await finalizeGame(event.scheduleTime)
  logger.info('Sunday game finalization finished.', { game: result.context.key, state: result.state, reason: result.reason })
})

exports.createVoteData = functions.pubsub
  .schedule('0 12 * * 0')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const db = admin.database()

    const now = new Date()

    const nextSunday = new Date(now)
    nextSunday.setDate(now.getDate() + (7 - now.getDay()))

    const yy = String(nextSunday.getFullYear())
    const mm = String(nextSunday.getMonth() + 1).padStart(2, '0')
    const dd = String(nextSunday.getDate()).padStart(2, '0')
    const customId = `${mm}${dd}`

    const ref = db.ref(`vote/${yy}/${customId}`)

    const newData = {
      message: 'created',
    }

    try {
      await ref.set(newData)
      console.log(`Data successfully added to vote/${yy} with ID ${customId}`)
    } catch (error) {
      console.error(
        `Error adding data to vote/${yy} with ID ${customId}:`,
        error,
      )
    }

    return null
  })
