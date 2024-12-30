const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')

const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

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
