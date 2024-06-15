import React, {useState} from 'react'
import Swal from 'sweetalert2';
import {getDatabase, ref, set} from 'firebase/database'
import {uid} from 'uid';
import getTimes from '@/hooks/getTimes.js'
import WriteBox from '@/components/organisms/WriteBox.jsx'
import InfoMessageBox from '@/components/molecules/InfoMessageBox.jsx'
import ShowRequestButton from '@/components/atoms/Button/ShowRequestButton.jsx'
import RequestBox from '@/components/organisms/RequestBox.jsx'
import Separator from '@/components/atoms/Separator.jsx'

const WriteContainer = (props) => {
  const { scrollContainerRef, registerRef, open, canRegister, setLastRecord, requestUpdateMode, setRequestUpdateMode, showRequestUpdateButton, requestList } = props
  const { time: { today, thisYear, currentTime, getGameStartTime, getGameEndTime } } = getTimes()
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  // const [showRequestUpdateButton, setShowRequestUpdateButton] = useState(false)
  // const [requestText, setRequestText] = useState('')
  const writeBoxPropsData = {scorer: scorer, setScorer, assistant: assistant, setAssistant: setAssistant}

  // RealTime Database 등록
  const registerHandler = () => {
    const day = currentTime.getDay()
    // if (!([0, 7].includes(day) && currentTime >= getGameStartTime && currentTime <= getGameEndTime)) {
    //   Swal.fire({
    //     icon: 'error',
    //     text: '기록 가능 시간이 아닙니다.'
    //   })
    // } else {
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
  // }

  return (
      <div className={!canRegister ? 'w-full' : 'flex flex-col items-center mt-4'}>
        {canRegister && <Separator fullWidth={true} />}
        {canRegister ?
            <WriteBox registerRef={registerRef} registerHandler={registerHandler} data={writeBoxPropsData}/>
            :
            <div className='relative flex justify-center'>
              {!requestUpdateMode ?
                  <div>
                    <InfoMessageBox open={open}/>
                    {showRequestUpdateButton && <ShowRequestButton setRequestUpdateMode={setRequestUpdateMode}/>}
                  </div>
                  :
                  <RequestBox requestList={requestList} setRequestUpdateMode={setRequestUpdateMode} today={today}
                              currentTime={currentTime}/>
              }
            </div>
        }
      </div>
  )
}

export default WriteContainer