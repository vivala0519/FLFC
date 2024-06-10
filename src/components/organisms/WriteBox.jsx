import RecordTypeText from '@/components/atoms/Text/RecordTypeText.jsx'
import RecordInput from '@/components/atoms/Text/RecordInput.jsx'
import RegisterButton from '@/components/atoms/Button/RegisterButton.jsx'

const WriteBox = (props) => {
  const { registerRef, registerHandler, data } = props
  const { scorer, setScorer, assistant, setAssistant } = data

  return (
    <div ref={registerRef} className='flex items-center gap-5 mb-1'>
      <div className='flex flex-col gap-2'>
        {[0, 1].map((index) => (
          <div key={index} className='flex gap-0.5 items-center'>
            <RecordTypeText type={index === 0 ? 'GOAL' : 'ASSIST'} width={'70px'}/>
            <RecordInput type={index === 0 ? scorer : assistant} setData={index === 0 ? setScorer : setAssistant} />
          </div>
        ))}
      </div>
      <RegisterButton text={'등록'} clickHandler={registerHandler} />
    </div>
  )
}

export default WriteBox