import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, remove, set} from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'
import RecordRow from '@/components/molecules/RecordRow.jsx'
import RoundRow from '@/components/molecules/RoundRow.jsx'

const RecordContainer = (props) => {
  const { formatRecordByName, recordsLoaded, open, isFeverTime, dynamicHeight, editingRecordKey, setEditingRecordKey, showMVP, displayRecord, lastRecord, canRegister, weeklyTeamData, setPendingRoundId, setShowSelectTeamPopup, setShowSelectScorerTeamPopup, setSelectTeamPopupMessage, setSelectScorerTeamPopupMessage, setPopupType, setPlayingTeams } = props
  const { time: { today, thisYear } } = getTimes()
  const [openRounds, setOpenRounds] = useState(new Set())
  const [closedRounds, setClosedRounds] = useState(new Set())
  const containerStyle = `w-[96%] relative overscroll-y-contain flex flex-col items-center p-2 border border-transparent overflow-x-hidden `
  const dynamicStyle = `${open ? 'flex' : 'hidden'} ${showMVP ? 'opacity-10' : 'opacity-100'}`

  const hasInitOpenRounds = useRef(false)
  const scrollContainerRef = useRef(null)
  const hasScrolledOnEntryRef = useRef(false)
  const shouldFollowLatestRef = useRef(true)

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!recordsLoaded || !open || !container || container.clientHeight === 0) return

    // Wait for loaded rows and layout before consuming the initial scroll.
    if (!hasScrolledOnEntryRef.current || shouldFollowLatestRef.current) {
      container.scrollTop = container.scrollHeight
      hasScrolledOnEntryRef.current = true
      shouldFollowLatestRef.current = true
    }
  }, [displayRecord, dynamicHeight, open, recordsLoaded])

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

  const deleteRecord = (toDeleteId, index) => {
    Swal.fire({
      title: '삭제, Really?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    }).then( async (result) => {
      if (result.isConfirmed) {
        const db = getDatabase()
        const refPath = thisYear + '/' + today + '_rounds'
        const roundRef = ref(db, refPath)

        const roundsSnapshot =  await get(roundRef)
        const rounds = roundsSnapshot.val()
        const roundValues = Object.values(rounds)

        if (roundValues.length > 0) {
          const lastRound = roundValues.reduce((prev, cur) => {
            const prevIndex = typeof prev.index === 'number' ? prev.index : -1
            const curIndex = typeof cur.index === 'number' ? cur.index : -1
            return curIndex > prevIndex ? cur : prev
          })

          const recordRef = ref(db, thisYear + '/' + today + '_rounds/' + lastRound.id + '/goal/' + toDeleteId)
          remove(recordRef).then(() => {
            console.log('Document successfully deleted!')
          })
          .catch((error) => {
            console.log(error)
          });

          const getGoalTeamRef = ref(db, thisYear + '/' + today + '_rounds/' + lastRound.id + '/getGoalTeam')

          const snap = await get(getGoalTeamRef)

          // 값이 없으면 그냥 종료
          if (!snap.exists()) return

          const list = snap.val()

          // 혹시 배열이 아니면 에러 처리
          if (!Array.isArray(list)) {
            console.error('getGoalTeam is not an array:', list)
            return
          }

          // 인덱스 범위 체크
          if (index < 0 || index >= list.length) {
            console.warn('invalid index:', index)
            return
          }

          // 해당 index 제거
          const newList = list.filter((_, i) => i !== index)
          // 또는: list.splice(index, 1); const newList = list

          // 다시 저장
          await set(getGoalTeamRef, newList)
        }

        // remove(recordRef).then(() => {
        //   console.log('Document successfully deleted!')
        // })
        //   .catch((error) => {
        //     console.log(error)
        //   });
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
        <div className={'w-full flex flex-col items-center'} key={index}>
          {/*{index !== 0 && (*/}
          <div className={`${!closedRounds.has(index) && 'border-blue-400'}w-[85%]`}></div>
          {/*)}*/}
          <RoundRow
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
          <div className={`${closedRounds.has(index) && 'hidden'} flex flex-col items-center w-full p-4 relative left-4`}>
            {record.goals?.map((goal, goalIndex) => (
              <>
                <RecordRow
                  key={goal.id ?? `goal-${goalIndex}`}
                  roundIndex={index}
                  index={goalIndex}
                  editingRecordKey={editingRecordKey}
                  setEditingRecordKey={setEditingRecordKey}
                  getGoalTeam={displayRecord[index]['getGoalTeam'][goalIndex]}
                  effect={goal.id === lastRecord}
                  record={goal}
                  isFeverTime={isFeverTime}
                  useDelete={canRegister}
                  isLastRound={displayRecord.length - 1 === index}
                  deleteRecord={deleteRecord}
                  formatRecordByName={formatRecordByName}
                />
                {/*<hr className={'relative -left-2 w-5/6 border-gray-100 dark:border-gray-700 ' + (goalIndex !== record.goals.length - 1 && 'mb-2')} />*/}
                <hr className={'relative left-1 w-7/12 border-gray-100 dark:border-gray-700 ' + (goalIndex !== record.goals.length - 1 && 'mb-4')} />
              </>
            ))}
            {record.goals.length === 0 && <div className={'font-dnf-forged text-gray-400 relative -left-4'}>득점 없당</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecordContainer
