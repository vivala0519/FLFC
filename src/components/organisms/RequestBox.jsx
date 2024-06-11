import { useState } from 'react'
import {getDatabase, ref, set} from 'firebase/database'
import {addDoc, collection} from 'firebase/firestore'
import {uid} from 'uid'
import {db} from '../../../firebase.js'
import CloseButton from '@/components/atoms/Button/CloseButton.jsx'
import RequestRow from '@/components/molecules/RequestRow.jsx'
import RequestInputBox from '@/components/molecules/RequestInputBox.jsx'

const RequestBox = (props) => {
  const {requestList, setRequestUpdateMode, today, currentTime } = props
  const [requestText, setRequestText] = useState('')
  const containerStyle = 'absolute -bottom-44 w-11/12 h-40 bg-white flex justify-center'
  const innerContainerStyle = 'relative border-t-2 w-full border-b-2 border-t-green-700 border-b-green-700'
  const listContainerStyle = 'w-full h-[calc(100%-32px)] overflow-y-auto'

  const sendRequest = async () => {
    if (requestText.trim()) {
      const rtDb = getDatabase()
      const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
      const id = uid()

      const request = {
        id: id,
        time: time,
        text: requestText,
        status: 'processing'
      }
      set(ref(rtDb, '2024/' + today + '_request' + '/' + id), request);

      // 메일 보내기
      const docRef = await addDoc(collection(db, 'mail'), {
        // to: ['vivala0519@gmail.com', 'leekun0801@gmail.com'],
        to: ['vivala0519@gmail.com'],
        message: {
          subject: 'FLFC : 기록 추가/수정 요청이 있습니다~!',
          html: `<span>요청 내용 : </span><span style="font-size: 17px; color: darkblue;">${requestText}</span><div><p>flfc.live/admin 접속 후 비번 : 0413</p><p>수정 후 '완료' 버튼 눌러주세요~</p></div>`,
        }
      });
      console.log('mail object written with ID: ', docRef.id);

      setRequestText('')
    }
  }

  return (
    <div className={containerStyle}>
      <div className={innerContainerStyle}>
        <CloseButton clickHandler={() => setRequestUpdateMode(false)} />
        <div className={listContainerStyle}>
          {requestList.map((request, index) => (
            <RequestRow key={index} request={request} />
          ))}
        </div>
        <RequestInputBox sendRequest={sendRequest} requestText={requestText} setRequestText={setRequestText} />
      </div>
    </div>
  )
}

export default RequestBox