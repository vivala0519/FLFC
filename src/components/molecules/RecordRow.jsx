import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'

const RecordRow = (props) => {
  const { record, index, deleteRecord, useDelete, effect } = props
  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] border-b-2 border-green-100 pt-1 pl-3 ${effect ? 'bg-effect' : ''}`
  const recordAreaStyle = 'flex items-center pl-5 pr-2 gap-3'
  const itemStyle = ` w-[20px] h-[20px] bg-[length:100%_100%] transform rotate-[11deg] relative bottom-[2px] right-[2px] `
  const goalIconStyle = 'bg-[url("@/assets/circle-ball.png")]'

  return (
    <div className={rawStyle} key={index}>
      <div className={`${itemStyle} ${goalIconStyle} animate-goal-roll`}></div>
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