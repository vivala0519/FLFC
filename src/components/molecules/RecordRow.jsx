import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'
import FeverTimeBar from '@/components/organisms/FeverTimeBar.jsx'
import EditingBadge from '@/components/atoms/EditingBadge.jsx'
import './RecordRow.css'
import getRecords from '@/hooks/getRecords.js'
import getTimes from '@/hooks/getTimes.js'
import { getDatabase, ref, update } from 'firebase/database'
import { useEffect, useRef, useState } from 'react'
import { isGameWriteAllowed } from '@/apis/gameWriteWindow.js'

const RecordRow = (props) => {
  const { record, index, roundIndex, roundId, deleteRecord, useDelete, isLastRound, isFeverTime, isFeverGoal = false, getGoalTeam, editingRecordKey, setEditingRecordKey } = props
  const {
    time: { thisYear, today },
  } = getTimes()
  const { gameStatus } = getRecords()
  const statusRef = useRef(gameStatus)
  statusRef.current = gameStatus

  const [randomInt, setRandomInt] = useState(1)
  const [goalRotation] = useState(() => Math.floor(Math.random() * 8) * 45)

  const [goalText, setGoalText] = useState(record.goal)
  const [assistText, setAssistText] = useState(record.assist || '')
  const recordKey = `${roundIndex}:${record.id}`
  const isEditing = editingRecordKey === recordKey

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

  useEffect(() => {
    if (isEditing) return
    setGoalText(record.goal)
    setAssistText(record.assist || '')
  }, [record.goal, record.assist, isEditing])

  const handleAreaClick = () => {
    if (useDelete && !editingRecordKey) setEditingRecordKey(recordKey)
  }

  const cancelEditing = () => {
    setGoalText(record.goal)
    setAssistText(record.assist || '')
    setEditingRecordKey(null)
  }


  useEffect(() => {
    if (!useDelete && isEditing) setEditingRecordKey(null)
  }, [useDelete, isEditing, setEditingRecordKey])

  const closeEditing = async () => {
    if (!useDelete || !roundId || !isGameWriteAllowed({ year: thisYear, day: today, status: statusRef.current })) return
    try {
      const goalRef = ref(getDatabase(), `${thisYear}/${today}_rounds/${roundId}/goal/${record.id}`)
      await update(goalRef, { goal: goalText, assist: assistText })
      // The parent aggregates the committed RTDB snapshot; the server owns the final aggregate.
      setEditingRecordKey(null)
    } catch (error) {
      console.error('기록을 수정하지 못했습니다:', error)
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
