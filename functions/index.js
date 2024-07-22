/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');

admin.initializeApp();

const OPENAI_API_KEY = functions.config().openai.key;

const corsHandler = cors({ origin: true });

exports.extractTextFromImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const imageUrl = req.body.url;

    console.log('Received image URL:', imageUrl);

    try {
      const gptResponse = await axios.post('https://api.openai.com/v1/images/generations', {
        prompt: "Extract text from the uploaded image.",
        images: [imageUrl],
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('GPT-4 response:', gptResponse.data);

      return res.json({ text: gptResponse.data.choices[0].text });

    } catch (error) {
      console.error('Error processing image with GPT-4:', error);
      return res.status(500).send('Error processing image with GPT-4');
    }
  });
});