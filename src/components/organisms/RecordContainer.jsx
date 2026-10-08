import { Fragment, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, runTransaction } from 'firebase/database'
import getRecords from '@/hooks/getRecords.js'
import { isGameWriteAllowed } from '@/apis/gameWriteWindow.js'
import { removeRoundGoal } from '@/apis/removeRoundGoal.js'
import getTimes from '@/hooks/getTimes.js'
import RecordRow from '@/components/molecules/RecordRow.jsx'
import RoundRow from '@/components/molecules/RoundRow.jsx'

const RecordContainer = (props) => {
  const { formatRecordByName, recordsLoaded, open, isFeverTime, dynamicHeight, editingRecordKey, setEditingRecordKey, showMVP, displayRecord, lastRecord, canRegister, weeklyTeamData, setPendingRoundId, setShowSelectTeamPopup, setShowSelectScorerTeamPopup, setSelectTeamPopupMessage, setSelectScorerTeamPopupMessage, setPopupType, setPlayingTeams, burstTargetRef, burstControllerRef } = props
  const { time: { today, thisYear } } = getTimes()
  const { gameStatus } = getRecords()
  const statusRef = useRef(gameStatus)
  statusRef.current = gameStatus
  const [openRounds, setOpenRounds] = useState(new Set())
  const [closedRounds, setClosedRounds] = useState(new Set())
  const containerStyle = `w-[96%] relative overscroll-y-contain flex flex-col items-center p-2 border border-transparent overflow-x-hidden `
  const dynamicStyle = `${open ? 'flex' : 'hidden'} ${showMVP ? 'opacity-10' : 'opacity-100'}`

  const hasInitOpenRounds = useRef(false)
  const scrollContainerRef = useRef(null)
  const hasScrolledOnEntryRef = useRef(false)
  const shouldFollowLatestRef = useRef(true)
  const [burstScrollRequest, setBurstScrollRequest] = useState(0)

  useImperativeHandle(burstControllerRef, () => ({
    scrollToLatest() {
      shouldFollowLatestRef.current = true
      setClosedRounds((current) => {
        const lastRoundIndex = displayRecord.length - 1
        if (!current.has(lastRoundIndex)) return current
        const next = new Set(current)
        next.delete(lastRoundIndex)
        return next
      })
      setBurstScrollRequest((request) => request + 1)
    },
  }), [displayRecord.length])

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!recordsLoaded || !open || !container || container.clientHeight === 0) return

    // Wait for loaded rows and layout before consuming the initial scroll.
    if (!hasScrolledOnEntryRef.current || shouldFollowLatestRef.current) {
      container.scrollTop = container.scrollHeight
      hasScrolledOnEntryRef.current = true
      shouldFollowLatestRef.current = true
    }
  }, [displayRecord, dynamicHeight, open, recordsLoaded, burstScrollRequest])

  const handleScroll = (event) => {
    if (!hasScrolledOnEntryRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    shouldFollowLatestRef.current = scrollHeight - clientHeight - scrollTop <= 4
  }

  useEffect(() => {
    if (!hasInitOpenRounds.current && displayRecord && displayRecord.length > 0) {
      setOpenRounds(new Set(displayRecord.map((_, idx) => idx)))
      hasInitOpenRounds.current = true
    }
  }, [displayRecord])

  const deleteRecord = (toDeleteId) => {
    const canMutate = () => canRegister && isGameWriteAllowed({ year: thisYear, day: today, status: statusRef.current })
    if (!canMutate()) return
    Swal.fire({
      title: '기록을 삭제할까요?', icon: 'warning', showCancelButton: true,
      confirmButtonText: '삭제', cancelButtonText: '취소',
    }).then(async (result) => {
      if (!result.isConfirmed || !canMutate()) return
      const lastRound = displayRecord[displayRecord.length - 1]
      const roundId = lastRound?.roundId || lastRound?.id
      if (!roundId) return
      try {
        const roundRef = ref(getDatabase(), `${thisYear}/${today}_rounds/${roundId}`)
        await get(roundRef)
        await runTransaction(roundRef, (round) => {
          if (!canMutate()) return
          return removeRoundGoal(round, toDeleteId)
        }, { applyLocally: false })
      } catch (error) {
        console.error('기록을 삭제하지 못했습니다:', error)
      }
    })
  }

  const roundShowHandler = (targetIndex) => {
    setOpenRounds(prev => {
      const next = new Set(prev)
      if (next.has(targetIndex)) {
        next.delete(targetIndex)
      } else {
        next.add(targetIndex)
      }
      return next
    })
    setClosedRounds(prev => {
      const next = new Set(prev)
      if (next.has(targetIndex)) {
        next.delete(targetIndex)
      } else {
        next.add(targetIndex)
      }
      return next
    })
  }

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className={containerStyle + dynamicStyle} style={{ height: open ? dynamicHeight : '' }}>
      {displayRecord.length === 0 && (
        <div className={'w-full flex flex-col items-center'}>
          <div className={`w-[85%] border-blue-400`}></div>
          <RoundRow
            canRegister={canRegister}
            index={0}
            fakeRow={true}
            record={{ winner: null, time: '08:00:00' }}
            weeklyTeamData={weeklyTeamData}
            setPendingRoundId={setPendingRoundId}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
          />
          <div className={'font-dnf-forged text-gray-400 relative top-4'}>득점 없당</div>
        </div>
      )}
      {displayRecord?.map((record, index) => (
        <div className={'w-full flex flex-col items-center'} key={record.roundId || record.id || index}>
          {/*{index !== 0 && (*/}
          <div className={`${!closedRounds.has(index) && 'border-blue-400'} w-[85%] `}></div>
          {/*)}*/}
          <RoundRow
            canRegister={canRegister}
            key={index}
            index={index}
            fakeRow={false}
            record={record}
            setPopupType={setPopupType}
            setPlayingTeams={setPlayingTeams}
            isOpen={!closedRounds.has(index)}
            weeklyTeamData={weeklyTeamData}
            roundShowHandler={roundShowHandler}
            setPendingRoundId={setPendingRoundId}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
          />
          {/*<div*/}
          {/*  className={`border-t-2 ${!closedRounds.has(index) && 'border-blue-300'} mt-1 w-[85%]`}*/}
          {/*></div>*/}
          <div className={`${closedRounds.has(index) && 'hidden'} flex flex-col items-center w-full py-4 px-6`}>
            {record.goals?.map((goal, goalIndex) => (
              <Fragment key={goal.id ?? `goal-${goalIndex}`}>
                <RecordRow
                  roundIndex={index}
                  roundId={record.roundId || record.id}
                  index={goalIndex}
                  editingRecordKey={editingRecordKey}
                  setEditingRecordKey={setEditingRecordKey}
                  getGoalTeam={goal.team ?? record.getGoalTeam?.[goalIndex]}
                  record={goal}
                  isFeverTime={isFeverTime}
                  isFeverGoal={goal.fever ?? record.goals.some((entry, entryIndex) =>
                    entry.id === 'fever-time-bar' && entryIndex < goalIndex
                  )}
                  useDelete={canRegister}
                  isLastRound={displayRecord.length - 1 === index}
                  deleteRecord={deleteRecord}
                  formatRecordByName={formatRecordByName}
                />
                {/*<hr className={'relative -left-2 w-5/6 border-gray-100 dark:border-gray-700 ' + (goalIndex !== record.goals.length - 1 && 'mb-2')} />*/}
                <hr className={'relative left-1 w-7/12 border-gray-100 dark:border-gray-700 ' + (goalIndex !== record.goals.length - 1 && 'mb-4')} />
              </Fragment>
            ))}
            {record.goals.length === 0 && <div className={'font-dnf-forged text-gray-400'}>득점 없당</div>}
          </div>
        </div>
      ))}
      {canRegister && (
        <div className="w-full shrink-0 pt-6 pb-8" aria-hidden="true">
          <div ref={burstTargetRef} className="record-burst-target h-px w-full" />
        </div>
      )}
    </div>
  )
}

export default RecordContainer
