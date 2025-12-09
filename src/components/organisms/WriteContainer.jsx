import React, { useState } from 'react'
import Swal from 'sweetalert2';
import {getDatabase, ref, get, set} from 'firebase/database'
import {uid} from 'uid'
import getTimes from '@/hooks/getTimes.js'
import WriteBox from '@/components/organisms/WriteBox.jsx'
import InfoMessageBox from '@/components/molecules/InfoMessageBox.jsx'
import ShowRequestButton from '@/components/atoms/Button/ShowRequestButton.jsx'
import RequestBox from '@/components/organisms/RequestBox.jsx'
import Separator from '@/components/atoms/Separator.jsx'

const WriteContainer = (props) => {
  const { weeklyTeamData, scrollContainerRef, registerRef, open, canRegister, setLastRecord, requestUpdateMode, setRequestUpdateMode, showRequestUpdateButton, requestList } = props
  const { time: { today, thisYear, currentTime, gameStartTime, gameEndTime } } = getTimes()
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  // const [showRequestUpdateButton, setShowRequestUpdateButton] = useState(false)
  // const [requestText, setRequestText] = useState('')
  const writeBoxPropsData = {scorer: scorer, setScorer, assistant: assistant, setAssistant: setAssistant}

  const createRound = async () => {
    const db = getDatabase()
    const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
    const roundId = uid()
    const dateRef = ref(db, `${thisYear}/${today}`)
    const snapshot = await get(dateRef)

    let roundIndex
    let startTime

    if (!snapshot.exists()) {
      roundIndex = 0
      startTime = '08:00:00'
    } else {
      const data = snapshot.val()
      const rounds = data.rounds || {}

      const roundValues = Object.values(rounds)

      // 이미 라운드가 하나 이상 있을 때, "가장 마지막 라운드" 찾기
      if (roundValues.length > 0) {
        const lastRound = roundValues.reduce((prev, cur) => {
          const prevIndex = typeof prev.index === 'number' ? prev.index : -1
          const curIndex = typeof cur.index === 'number' ? cur.index : -1
          return curIndex > prevIndex ? cur : prev
        })

        // 마지막 라운드의 winnerTeam 이 아직 null 이면 새 라운드 생성하지 않고 종료
        if (!lastRound.winnerTeam) {
          // 마지막 라운드의 id 리턴
          return lastRound['id']
        }
      }

      // 🔹 여기까지 왔다는 건 "마지막 라운드가 끝난 상태"라는 뜻
      const indices = roundValues.map(r =>
        typeof r.index === 'number' ? r.index : 0
      )

      const maxIndex = indices.length ? Math.max(...indices) : -1

      roundIndex = maxIndex + 1
      startTime = time
    }
    console.log(roundIndex, startTime)

    const roundRef = ref(db, `${thisYear}/${today}/rounds/${roundId}`)

    const roundData = {
      id: roundId,
      index: roundIndex,
      time: startTime,
      winnerTeam: null,
      getGoalTeam: [],
      pointWinners: [],
    }
    console.log(roundData)

    await set(roundRef, roundData)
    return roundId;
  }

  // RealTime Database 등록
  const registerHandler = async () => {
    const day = currentTime.getDay()
    if (([0, 7].includes(day) && currentTime >= gameStartTime && currentTime <= gameEndTime)) {
      Swal.fire({
        icon: 'error',
        text: '기록 가능 시간이 아닙니다.'
      })
    } else {
      const db = getDatabase()
      const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
      const goalId = uid()

      const roundId = await createRound()

      if (scorer.trim()) {
        const record = {
          id: goalId,
          time: time,
          goal: scorer.trim(),
          assist: assistant.trim()
        }
        const teamNumber = Object.keys(weeklyTeamData['data']).find(k => weeklyTeamData['data'][k].includes(scorer))
        // 해당 선수가 팀에 있는 경우
        if (teamNumber) {
          // 해당 라운드의 getGoalTeam 경로
          const goalTeamRef = ref(db, `${thisYear}/${today}/rounds/${roundId}/getGoalTeam`)

          // 기존 배열 가져오기
          const goalTeamSnap = await get(goalTeamRef)
          const currentList = goalTeamSnap.exists() && Array.isArray(goalTeamSnap.val())
            ? goalTeamSnap.val()
            : []

          // 배열에 teamNumber 추가
          currentList.push(teamNumber)

          // 다시 저장
          await set(goalTeamRef, currentList)
        } else {
          // 자책/용병 case
          console.log('error')
        }
        const goalRef = ref(db, `${thisYear}/${today}/rounds/${roundId}/goal/${goalId}`)
        await set(goalRef, record)
        return
        set(ref(db, thisYear + '/' + today + '/' + id), record);
        set(ref(db, thisYear + '/' + today + '/roundInfo'), record);
        set(ref(db, thisYear +'/' + today + '_backup' + '/' + goalId), record);
        setLastRecord(goalId)
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

  return (
    <div className={!canRegister ? 'w-full' : 'flex flex-col items-center mt-4 w-[80%]'}>
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
            <RequestBox requestList={requestList} setRequestUpdateMode={setRequestUpdateMode} today={today} currentTime={currentTime}/>
          }
        </div>
      }
    </div>
  )
}

export default WriteContainer