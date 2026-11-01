const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const WEBHOOK_URL = defineSecret("FLFC_NEWS_WEBHOOK_URL");
const WEBHOOK_KEY = defineSecret("FLFC_NEWS_WEBHOOK_KEY");
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getDatabase } = require('firebase-admin/database')

admin.initializeApp()

const { createWeeklyMatchFinalizer } = require('./finalizeWeeklyMatch')
const finalizeWeeklyMatch = createWeeklyMatchFinalizer({
    firestore: getFirestore(),
    rtdb: getDatabase(),
    timestamp: () => FieldValue.serverTimestamp(),
})

exports.triggerWeeklyNews = onSchedule(
    {
        schedule: "0 10 * * 0",
        timeZone: "Asia/Seoul",
        region: "asia-northeast3",
        secrets: [WEBHOOK_URL, WEBHOOK_KEY],
        retryCount: 3,
        minBackoffSeconds: 30,
    },
    async (event) => {
        const result = await finalizeWeeklyMatch(event.scheduleTime);
        if (result.status !== 'completed') {
            logger.info('Weekly match skipped', result);
            return;
        }
        const id = result.id;
        const res = await fetch(WEBHOOK_URL.value(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 루틴 패널에 안내된 방식대로 키를 넣어 주세요
                Authorization: `Bearer ${WEBHOOK_KEY.value()}`,
            },
            body: JSON.stringify({ date: id }),
        });
        if (!res.ok) throw new Error(`webhook ${res.status}`);
    }
);

// exports.createVoteData = functions.pubsub
//   .schedule('0 12 * * 0')
//   .timeZone('Asia/Seoul')
//   .onRun(async (context) => {
//     const db = admin.database()
//
//     const now = new Date()
//
//     const nextSunday = new Date(now)
//     nextSunday.setDate(now.getDate() + (7 - now.getDay()))
//
//     const yy = String(nextSunday.getFullYear())
//     const mm = String(nextSunday.getMonth() + 1).padStart(2, '0')
//     const dd = String(nextSunday.getDate()).padStart(2, '0')
//     const customId = `${mm}${dd}`
//
//     const ref = db.ref(`vote/${yy}/${customId}`)
//
//     const newData = {
//       message: 'created',
//     }
//
//     try {
//       await ref.set(newData)
//       console.log(`Data successfully added to vote/${yy} with ID ${customId}`)
//     } catch (error) {
//       console.error(
//         `Error adding data to vote/${yy} with ID ${customId}:`,
//         error,
//       )
//     }
//
//     return null
//   })
