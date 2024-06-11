import SendRequestButton from '@/components/atoms/Button/SendRequestButton.jsx'
import RequestInput from '@/components/atoms/Text/BaseInput.jsx'

const RequestInputBox = (props) => {
  const { sendRequest, requestText, setRequestText } = props
  const boxStyle = 'absolute bottom-0 w-full h-8 flex flex-row text-[12px]'

  return (
    <div className={boxStyle}>
      <RequestInput propsValue={requestText} changeHandler={setRequestText} />
      <SendRequestButton clickHandler={sendRequest} />
    </div>
  )
}

export default RequestInputBox