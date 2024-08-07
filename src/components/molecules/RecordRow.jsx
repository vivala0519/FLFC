import TimeText from '@/components/atoms/Text/TimeText.jsx'
import RecordEl from '@/components/atoms/RecordEl.jsx'
import DeleteButton from '@/components/atoms/Button/DeleteButton.jsx'

const RecordRow = (props) => {
  const { record, index, deleteRecord, useDelete, effect } = props
  const rawStyle = `relative flex items-center justify-center mobile:justify-normal w-[85%] gap-5 pt-1 ${effect ? 'bg-effect' : ''}`
  const recordAreaStyle = 'flex items-center pl-2 pr-2 border-b-green-600 border-b-[1px]'

  return (
    <div className={rawStyle} key={index}>
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