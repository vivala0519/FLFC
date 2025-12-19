import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'
import { useEffect, useState } from 'react'

const RecordRow = (props) => {
  const { record, index, deleteRecord, useDelete, effect } = props
  const [randomInt, setRandomInt] = useState(1)
  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] border-b-2 border-blue-100 pt-1 pl-3 ${effect ? 'bg-effect' : ''}`
  const recordAreaStyle = 'flex items-center pl-5 pr-2 gap-3 relative bottom-[2px]'
  const itemStyle = `w-[20px] h-[20px] bg-[length:100%_100%] transform rotate-[11deg] relative bottom-[2px] right-[2px] `
  const goalIconStyle = 'bg-[url("@/assets/circle-ball.png")]'

  useEffect(() => {
    const randomNumber = Math.floor(Math.random() * 4) + 1
    setRandomInt(randomNumber)

  }, [])

  return (
    <div className={rawStyle} key={index}>
      <div className={`${itemStyle} ${goalIconStyle} animate-goal-roll-${randomInt}`}></div>
      <TimeText text={record.time.slice(0, 5)}/>
      <div className={recordAreaStyle}>
        <RecordEl type={'GOAL'} text={record.goal} />
        {record.assist &&
          <RecordEl type={'ASSIST'} text={record.assist} />
        }
      </div>
      {useDelete &&
        <DeleteButton clickHandler={() => deleteRecord(index)} />
      }
    </div>
  )
}

export default RecordRow