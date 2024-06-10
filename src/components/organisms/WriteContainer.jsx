import React, {useState} from 'react'
import styled from 'styled-components'
import request from '@/assets/request.png'
import Swal from 'sweetalert2';
import {getDatabase, ref, set} from 'firebase/database'
import {uid} from 'uid';
import {addDoc, collection} from 'firebase/firestore'
import {db} from '../../../firebase.js'
import WriteBox from '@/components/organisms/WriteBox.jsx'

const WriteContainer = (props) => {
  const { scrollContainerRef, registerRef, open, canRegister, today, currentTime, thisYear, startTime, endTime, setLastRecord, requestUpdateMode, setRequestUpdateMode, showRequestUpdateButton, requestList } = props
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  // const [showRequestUpdateButton, setShowRequestUpdateButton] = useState(false)
  const [requestText, setRequestText] = useState('')
  const writeBoxPropsData = {scorer: scorer, setScorer, assistant: assistant, setAssistant: setAssistant}
  // const [requestList, setRequestList] = useState([])

  // RealTime Database 등록
  const registerHandler = () => {
    console.log('isinhere')
    const day = currentTime.getDay()
    if (!([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime)) {
      Swal.fire({
        icon: 'error',
        text: '기록 가능 시간이 아닙니다.'
      })
    } else {
      const db = getDatabase()
      const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
      const id = uid()

      if (scorer.trim()) {
        const record = {
          id: id,
          time: time,
          goal: scorer.trim(),
          assist: assistant.trim()
        }
        set(ref(db, thisYear + '/' + today + '/' + id), record);
        set(ref(db, thisYear +'/' + today + '_backup' + '/' + id), record);
        setLastRecord(id)
        setScorer('')
        setAssistant('')
      }

      // 스크롤 내려주기
      const scrollToElement = () => {
        const scrollContainer = scrollContainerRef.current;

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollContainer.clientHeight,
            behavior: 'smooth',
          });
        }
      }
      setTimeout(() => {
        scrollToElement()
      }, 300)
    }
  }


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
        to: ['vivala0519@gmail.com', 'leekun0801@gmail.com'],
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
    <div className={!canRegister && 'w-full'}>
      <hr className={canRegister ? 'border-1 border-green-600 w-full mt-4 mb-4' : 'hidden'}/>
      {canRegister ?
        <WriteBox registerRef={registerRef} registerHandler={registerHandler} data={writeBoxPropsData}/>
        :
        <div className='relative flex justify-center'>
          {!requestUpdateMode ?
            <div>
              <div className={open ? 'relative top-6' : 'relative bottom-4'}>
                <p className='mb-1' style={{fontFamily: 'DNFForgedBlade'}}>기록 가능 시간이 아닙니다.</p>
                <p className='text-xs text-gray-400' style={{fontFamily: 'DNFForgedBlade'}}>Open : 07:50 ~ 10:05
                  Sun.</p>
                {open && <p className='text-xs text-gray-400' style={{fontFamily: 'DNFForgedBlade'}}>기록은 오늘 하루 동안
                  유지됩니다.</p>}
              </div>
              {showRequestUpdateButton &&
                  <Request className='absolute right-0 top-6 cursor-pointer'
                           onClick={() => setRequestUpdateMode(true)}>
                    <div className='flex flex-col relative top-4'>
                      <span className='text-white' style={{fontSize: '12px'}}>수정</span>
                      <span className='text-white' style={{fontSize: '12px'}}>요청</span>
                    </div>
                  </Request>
              }
            </div>
            :
            <div className='absolute -bottom-44 w-11/12 h-40 bg-white flex justify-center'>
              <div className='relative border-t-2 w-full border-b-2 border-t-green-700 border-b-green-700'>
                <CloseRequest className='absolute top-0 -right-4 text-xl text-black bg-white cursor-pointer'
                              onClick={() => setRequestUpdateMode(false)}>X</CloseRequest>
                <RequestList className='w-full'>
                  {requestList.map((request, index) => (
                      <div key={index}
                           className='flex border-b-2 border-b-yellow-500 p-1 pr-3 pl-2 justify-between'>
                        <span className='text-xs text-black' style={{textAlign: 'left'}}>{request.text}</span>
                        {request.status === 'processing' && <span className='text-xs text-rose-700' style={{
                          width: '42px',
                          textAlign: 'right'
                        }}>{'처리중'}</span>}
                        {request.status === 'resolved' && <span className='text-xs text-blue-700'>{'완료'}</span>}
                      </div>
                  ))}
                </RequestList>
                <div className='absolute bottom-0 w-full h-8 flex flex-row'>
                  <RequestInput className='w-10/12 border-2 border-b-0 pl-1'
                                placeholder='ex) O시 O분 골 OO -> OO 로 수정 요청합니다~' value={requestText}
                                onChange={(event) => setRequestText(event.target.value)}/>
                  <div
                      className='w-2/12 flex items-center content-center justify-center border-2 border-b-0 border-l-0 text-black bg-white'
                      onClick={sendRequest}>요청
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  )
}

export default WriteContainer



const Request = styled.div`
  background: url(${request}) no-repeat center center;
  background-size: 100% 100%;
  width: 60px;
  height: 60px;
`

const RequestList = styled.div`
  height: calc(100% - 32px);
  overflow-y: auto;
`

const RequestInput = styled.input`
  font-size: 12px;
`

const CloseRequest = styled.div`
    @media (prefers-color-scheme: dark) {
        background-color: black;
        color: white;
    };
`