import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'
import FeverTimeBar from '@/components/organisms/FeverTimeBar.jsx'
import getRecords from '@/hooks/getRecords.js'
import getTimes from '@/hooks/getTimes.js'
import { getDatabase, ref, update } from 'firebase/database'
import { doc, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import {db} from "../../../firebase.js";

const RecordRow = (props) => {
  const { record, index, roundIndex, deleteRecord, useDelete, effect, isLastRound, isFeverTime, formatRecordByName } = props
  const { time: { thisYear, today } } = getTimes()
  const { todaysRealtimeRound } = getRecords()

  const [randomInt, setRandomInt] = useState(1)

  const [isEditing, setIsEditing] = useState(false)
  const [goalText, setGoalText] = useState(record.goal)
  const [assistText, setAssistText] = useState(record.assist || '')

  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] border-b-2 border-blue-100 pt-1 pl-3 ${effect ? 'bg-effect' : ''}`
  const recordAreaStyle = 'flex items-center pl-5 pr-2 gap-3 relative bottom-[2px] cursor-pointer'
  const itemStyle = `w-[20px] h-[20px] bg-[length:100%_100%] transform rotate-[11deg] relative bottom-[2px] right-[2px] `
  const goalIconStyle = 'bg-[url("@/assets/circle-ball.png")]'
  const rollClassMap = {
    1: 'animate-goal-roll-1',
    2: 'animate-goal-roll-2',
    3: 'animate-goal-roll-3',
    4: 'animate-goal-roll-4',
  }

  useEffect(() => {
    const randomNumber = Math.floor(Math.random() * 4) + 1
    setRandomInt(randomNumber)
  }, [])

  const handleAreaClick = () => {
    if (!isEditing && useDelete) setIsEditing(true)
  }


  const parseTimeFromString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  const registerRecord = async (stats) => {
    const docRef = doc(db, thisYear, today)
    await setDoc(docRef, stats)
    console.log('Document updated with ID: ', docRef.id)
  }

  const closeEditing = async () => {
    if (!useDelete) return
    const db = getDatabase();
    const roundId = String(roundIndex + 1).padStart(2, '0')
    const targetId = record['id']
    const goalRef = ref(db, `${thisYear}/${today}_rounds/${roundId}/goal/${targetId}`);
    const updates = {goal: goalText, assist: assistText}
    await update(goalRef, updates);
    setIsEditing(false)

    const data = todaysRealtimeRound
    if (Object.keys(data).length > 0) {

      // firestore에 등록하기 위한 전체 골 data
      const goalRecord = Object.values(data || {}).flatMap(round => {
        if (!round.goal) return []

        return Object.values(round.goal).map(goal => ({
          ...goal,
        })).sort((a, b) => parseTimeFromString(a.time) - parseTimeFromString(b.time))
      })
      // display 위한 라운드/골 데이터
      const roundRecord = Object.entries(data || {})
          .map(([roundId, round]) => ({
            ...round,
            roundId,
            goals: round.goal ? Object.values(round.goal).sort((a, b) => parseTimeFromString(a.time) - parseTimeFromString(b.time)) : []
          }))
          .sort((a, b) => a.index - b.index)
      const stats = formatRecordByName(goalRecord, roundRecord)
      await registerRecord(stats)
    }
  }

  if (record.id === 'fever-time-bar') {
    return (
        <div className={'w-full'}>
          <FeverTimeBar isFeverTime={isFeverTime} />
        </div>
    )
  } else {
    return (
        <div className={rawStyle} key={index}>
          <div className={`${itemStyle} ${goalIconStyle} ${rollClassMap[randomInt]}`}></div>
          {!isEditing && <TimeText text={record.time.slice(0, 5)}/>}

          <div
              className={recordAreaStyle}
              onClick={handleAreaClick}
          >
            <RecordEl
                type={'GOAL'}
                text={goalText}
                isEditing={isEditing}
                onChange={(e) => setGoalText(e.target.value)}
            />
            {(record.assist || isEditing) && (
                <RecordEl
                    type={'ASSIST'}
                    text={assistText}
                    isEditing={isEditing}
                    onChange={(e) => setAssistText(e.target.value)}
                />
            )}
          </div>

          { !isEditing && useDelete && isLastRound && (
              <DeleteButton clickHandler={() => deleteRecord(record.id, index)} />
          )}
          {isEditing && (<div className={'text-green-500 mb-1.5'} onClick={closeEditing}>확인</div>)}
        </div>
    )
  }
}

export default RecordRow