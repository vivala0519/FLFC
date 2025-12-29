import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'
import FeverTimeBar from '@/components/organisms/FeverTimeBar.jsx'
import { useEffect, useState } from 'react'

const RecordRow = (props) => {
  const {
    record,
    index,
    deleteRecord,
    useDelete,
    effect,
    isLastRound,
    isFeverTime,
  } = props
  const [randomInt, setRandomInt] = useState(1)
  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] border-b-2 border-blue-100 pt-1 pl-3 ${effect ? 'bg-effect' : ''}`
  const recordAreaStyle = 'flex items-center pl-5 pr-2 gap-3 relative bottom-[2px]'
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
        <TimeText text={record.time.slice(0, 5)} />
        <div className={recordAreaStyle}>
          <RecordEl type={'GOAL'} text={record.goal} />
          {record.assist && <RecordEl type={'ASSIST'} text={record.assist} />}
        </div>
        {useDelete && isLastRound && (
          <DeleteButton clickHandler={() => deleteRecord(record.id, index)} />
        )}
      </div>
    )
  }
}

export default RecordRow