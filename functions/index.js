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


exports.scheduledFunction = functions.pubsub.schedule('every day 07:20').timeZone('Asia/Seoul').onRun(async (context) => {
  console.log("it's time to automate something1111")
  const db = admin.firestore()

  // Firestore에 추가할 데이터 예시
  const newData = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    content: "자동으로 생성된 데이터"
  }

  try {
    // Firestore 컬렉션에 데이터 추가
    await db.collection('yourCollectionName').add(newData)
    console.log('문서가 성공적으로 작성되었습니다!')
  } catch (error) {
    console.error('문서 작성 중 오류 발생: ', error)
  }

  return null
})

exports.scheduledFunction = functions.pubsub.schedule('every day 16:20').timeZone('Asia/Seoul').onRun(async (context) => {
  console.log("it's time to automate something2222")
})

// chat GPT function
const OPENAI_API_KEY = functions.config().openai.key;

const corsHandler = cors({ origin: true });

exports.extractTextFromImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    const imageUrls = req.body.urls;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    };

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              // text: '이미지에서 인원을 모두 참석자로 분류한 후, 댓글의 내용을 반영해서 신규 참석자와 변경된 불참자를 제거해서 나열해줘. 댓글 내용의 용병도 참석자에 추가해줘.\n - 댓글에 "불참으로 변경", "불참합니다", "불참입니다"라는 내용이 있는 사람은 빼줘\n - "키퍼 참" 이라는 내용은 참석이야\n - "아홉시 반까지만 참여" 라는 내용도 참석이야 - "아홉시 반까지밖에 못합니다" 라는 내용도 참석이야',
              text: '월회비 참석자, 주회비 참석자를 합쳐서 참석자 리스트를 자바스크립트 배열 형태로 추출해주고 댓글에서 누가 어떤 글을 썼는지 이름: text 형태로 정리해줘',
            },
            // {
            //   type: 'image_url',
            //   image_url: {'url': imageUrl},
            // },
          ],
        },
      ],
      max_tokens: 300,
    };
    imageUrls?.forEach(url => payload.messages[0].content.push({ type: 'image_url', image_url: { 'url': url } }));


    console.log('Received image URL:', imageUrls);

    try {
      axios
        .post('https://api.openai.com/v1/chat/completions', payload, { headers })
        .then((response) => {
          console.log('Response:', response.data.choices[0]);

          return res.json({ obj: response.data.choices[0]})
        })
        .catch((error) => {
          console.error('Error:', error.response ? error.response.data : error.message);
        });
    } catch (error) {
      console.error('Error processing image with GPT-4:', error);
      return res.status(500).send('Error processing image with GPT-4');
    }
  });
});


exports.extractAttendee = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
    const requestText = req.body.text;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    };

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              // text: '이미지에서 인원을 모두 참석자로 분류한 후, 댓글의 내용을 반영해서 신규 참석자와 변경된 불참자를 제거해서 나열해줘. 댓글 내용의 용병도 참석자에 추가해줘.\n - 댓글에 "불참으로 변경", "불참합니다", "불참입니다"라는 내용이 있는 사람은 빼줘\n - "키퍼 참" 이라는 내용은 참석이야\n - "아홉시 반까지만 참여" 라는 내용도 참석이야 - "아홉시 반까지밖에 못합니다" 라는 내용도 참석이야',
              text: `${requestText}\n 댓글 내용을 바탕으로 최종 참석자 알려줘. 용병이 있다면 총 몇 명인지 계산해서 참석자 리스트에 넣어줘. \n아홉시 반까지 라는 단어가 있으면 참석한다는 뜻이야`,
            },
            // {
            //   type: 'image_url',
            //   image_url: {'url': imageUrl},
            // },
          ],
        },
      ],
      max_tokens: 300,
    };

    try {
      axios
          .post('https://api.openai.com/v1/chat/completions', payload, { headers })
          .then((response) => {
            console.log('Response:', response.data.choices[0]);

            return res.json({ obj: response.data.choices[0]})
          })
          .catch((error) => {
            console.error('Error:', error.response ? error.response.data : error.message);
          });
    } catch (error) {
      console.error('Error processing image with GPT-4:', error);
      return res.status(500).send('Error processing image with GPT-4');
    }
  });
});