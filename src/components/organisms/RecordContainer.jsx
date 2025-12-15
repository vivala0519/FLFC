import { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {getDatabase, ref, remove} from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'
import RecordRow from '@/components/molecules/RecordRow.jsx'
import RoundRow from '@/components/molecules/RoundRow.jsx'

const RecordContainer = (props) => {
  const { scrollContainerRef, open, dynamicHeight, showMVP, displayRecord, lastRecord, canRegister, weeklyTeamData, setPendingRoundId, setShowSelectTeamPopup, setShowSelectScorerTeamPopup, setSelectTeamPopupMessage, setSelectScorerTeamPopupMessage } = props
  const { time: { today, thisYear } } = getTimes()
  const [openRounds, setOpenRounds] = useState(new Set())
  const [closedRounds, setClosedRounds] = useState(new Set())
  const containerStyle = `w-[96%] relative overflow-auto flex flex-col items-center bg-white p-2 border border-transparent `
  const dynamicStyle = `${open ? 'flex' : 'hidden'} ${showMVP ? 'opacity-10' : 'opacity-100'}`

  const hasInitOpenRounds = useRef(false)

  useEffect(() => {
    if (!hasInitOpenRounds.current && displayRecord && displayRecord.length > 0) {
      setOpenRounds(new Set(displayRecord.map((_, idx) => idx)))
      hasInitOpenRounds.current = true
    }
    console.log(displayRecord)
  }, [displayRecord])

  const deleteRecord = (index) => {
    Swal.fire({
      title: '삭제, Really?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    }).then((result) => {
      if (result.isConfirmed) {
        const db = getDatabase()
        const recordRef = ref(db, thisYear + '/' + today + '/' + displayRecord[index].id)
        // remove(ref(db, thisYear + '/' + today + '/' + todayRecord[index].id))
        remove(recordRef).then(() => {
          console.log('Document successfully deleted!')
        })
          .catch((error) => {
            console.log(error)
          });
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
    <div
      ref={scrollContainerRef}
      className={containerStyle + dynamicStyle}
      style={{ height: open ? dynamicHeight : '' }}
    >
      {
        displayRecord.length === 0 && (
          <div className={'w-full flex flex-col items-center'}>
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
            <div className={'text-black'}>득점 없당</div>
          </div>
        )
      }
      {displayRecord?.map((record, index) => (
        <div className={'w-full flex flex-col items-center'} key={index}>
          {index !== 0 && (
            <div
              className={`border-t-2 ${!closedRounds.has(index) && 'border-green-300'} mb-2 w-[85%]`}
            ></div>
          )}
          <RoundRow
            key={index}
            index={index}
            fakeRow={false}
            record={record}
            isOpen={!closedRounds.has(index)}
            weeklyTeamData={weeklyTeamData}
            roundShowHandler={roundShowHandler}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
          />
          <div
            className={`border-t-2 ${!closedRounds.has(index) && 'border-green-300'} mt-1 w-[85%]`}
          ></div>
          <div
            className={`${closedRounds.has(index) && 'hidden'} flex flex-col items-center gap-5 w-full p-4`}
          >
            {record.goals?.map((goal, index) => (
              <RecordRow
                key={index}
                index={index}
                effect={goal.id === lastRecord}
                record={goal}
                useDelete={canRegister}
                deleteRecord={deleteRecord}
              />
            ))}
            {record.goals.length === 0 && <div className={'text-black'}>득점 없당</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecordContainer