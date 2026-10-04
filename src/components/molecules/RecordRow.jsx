import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'
import FeverTimeBar from '@/components/organisms/FeverTimeBar.jsx'
import EditingBadge from '@/components/atoms/EditingBadge.jsx'
import './RecordRow.css'
import getRecords from '@/hooks/getRecords.js'
import getTimes from '@/hooks/getTimes.js'
import { getDatabase, ref, update } from 'firebase/database'
import { doc, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import {db} from "../../../firebase.js";

const RecordRow = (props) => {
  const { record, index, roundIndex, deleteRecord, useDelete, isLastRound, isFeverTime, isFeverGoal = false, formatRecordByName, getGoalTeam, editingRecordKey, setEditingRecordKey } = props
  const {
    time: { thisYear, today, thisDay, currentTime, gameStartTime, gameEndTime },
  } = getTimes()
  const { todaysRealtimeRound } = getRecords()

  const [randomInt, setRandomInt] = useState(1)
  const [goalRotation] = useState(() => Math.floor(Math.random() * 8) * 45)

  const [goalText, setGoalText] = useState(record.goal)
  const [assistText, setAssistText] = useState(record.assist || '')
  const recordKey = `${roundIndex}:${record.id}`
  const isEditing = editingRecordKey === recordKey
  const canWriteFirestoreRecord =
    thisDay === 0 &&
    currentTime >= gameStartTime &&
    currentTime <= gameEndTime

  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] pt-1 transition-[left] duration-300 ease-out motion-reduce:transition-none ${isEditing ? '-left-4 pl-0 gap-0' : 'gap-1.5'}`
  const recordAreaStyle = 'flex items-center pr-2 relative bottom-[2px]'
  const recordCursorStyle = editingRecordKey && !isEditing ? 'cursor-not-allowed' : useDelete ? 'cursor-pointer' : 'cursor-default'
  const itemStyle = `w-[15px] h-[15px] relative bottom-[1px] `
  const goalIconStyle = 'bg-[url("@/assets/futsal-ball4.png")] dark:bg-[url("@/assets/futsal-ball-yellow.png")]'
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
    if (useDelete && !editingRecordKey) setEditingRecordKey(recordKey)
  }

  const cancelEditing = () => {
    setGoalText(record.goal)
    setAssistText(record.assist || '')
    setEditingRecordKey(null)
  }


  const parseTimeFromString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  const registerRecord = async (stats) => {
    if (!canWriteFirestoreRecord) {
      console.warn('Firestore record write blocked outside Sunday 08:00-10:00')
      return
    }

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
    setEditingRecordKey(null)
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
        {isEditing && <EditingBadge />}
        {!isEditing && (
          <span className="w-4 shrink-0 text-[8px] bottom-1.5" aria-hidden={isFeverGoal}>
            {!isFeverGoal && <>{getGoalTeam}팀</>}
          </span>
        )}
        {!isEditing && (
          <div className={`${itemStyle} ${rollClassMap[randomInt]}`}>
            <div className={`h-full w-full bg-[length:100%_100%] ${goalIconStyle}`} style={{ transform: `rotate(${goalRotation}deg)` }} />
          </div>
        )}
        {!isEditing && <TimeText text={record.time.slice(0, 5)} />}

        <div className={`${recordAreaStyle} ${recordCursorStyle} ${!isEditing ? 'gap-8' : 'record-row-edit-enter'}`} onClick={handleAreaClick}>
          <RecordEl type={'Goal'} text={goalText} isEditing={isEditing} onChange={(e) => setGoalText(e.target.value)} />
          {(record.assist || isEditing) && (
            <RecordEl type={'Assist'} text={assistText} isEditing={isEditing} onChange={(e) => setAssistText(e.target.value)} />
          )}
        </div>

        {!editingRecordKey && useDelete && isLastRound && <DeleteButton clickHandler={() => deleteRecord(record.id, index)} />}
        {isEditing && (
          <div className={'record-row-edit-enter flex gap-3 whitespace-pre items-center justify-around w-full relative left-2 bottom-1'}>
            <div className={'text-green-600 dark:text-green-500 w-full'} onClick={closeEditing}>
              확인
            </div>
            <div className={'text-red-400 w-full'} onClick={cancelEditing}>
              취소
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default RecordRow
