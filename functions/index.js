const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onValueWritten } = require('firebase-functions/v2/database')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const logger = require('firebase-functions/logger')

const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const correctionOptions = {
  region: 'us-central1', memory: '256MiB', minInstances: 0,
  maxInstances: 1, concurrency: 1, timeoutSeconds: 120, retry: true,
}

async function synchronizeCorrection(event, source, year, day, beforeRounds, beforeStats) {
  const { getMatchTargetForDate } = await import('./lib/matchDate.mjs')
  const target = getMatchTargetForDate(year, day)
  if (!target) return
  const { syncMatchCorrection } = await import('./lib/syncMatchCorrection.mjs')
  const { RecordDataError } = await import('./lib/matchArchive.mjs')
  try {
    const state = await syncMatchCorrection({
      firestore: admin.firestore(), database: admin.database(), target, source, beforeRounds, beforeStats,
      changedAt: Date.parse(event.time),
    })
    if (state) logger.info('Match correction synchronized', { source, match: target.key, revision: state.revision })
  } catch (error) {
    if (!(error instanceof RecordDataError)) throw error
    // Invalid console edits must not retry indefinitely; the next valid edit triggers a new sync.
    logger.error('Invalid match correction; fix the source data and save again', { source, match: target.key, error: error.message })
  }
}

exports.syncRoundCorrections = onValueWritten({
  ...correctionOptions, ref: '/{year}/{match=*_rounds}', instance: 'flfc-d38b0-default-rtdb',
}, (event) => synchronizeCorrection(event, 'rtdb', event.params.year,
  event.params.match.replace(/_rounds$/, ''), event.data.before.val()))

exports.syncStatCorrections = onDocumentWritten({
  ...correctionOptions, document: '{year}/{day}',
}, (event) => synchronizeCorrection(event, 'firestore', event.params.year, event.params.day,
  undefined, event.data.before.data()))

exports.syncManualOverrides = onDocumentWritten({
  ...correctionOptions, document: 'matchCorrections/{match}',
}, (event) => synchronizeCorrection(event, 'overrides', event.params.match.slice(0, 4), event.params.match.slice(4)))

exports.finalizeSundayMatch = onSchedule({
  schedule: '0 10 * * 0',
  timeZone: 'Asia/Seoul',
  region: 'us-central1',
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 1,
  timeoutSeconds: 120,
  retryCount: 5,
  minBackoffSeconds: 60,
  maxBackoffSeconds: 600,
}, async (event) => {
  const { getMatchTarget } = await import('./lib/matchDate.mjs')
  const { finalizeMatch } = await import('./lib/finalizeMatch.mjs')
  const target = getMatchTarget(event.scheduleTime || new Date(), { scheduled: true })
  const state = await finalizeMatch({ firestore: admin.firestore(), database: admin.database(), target })
  logger.info('Sunday match finalized', { match: target.key, revision: state.revision })
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
