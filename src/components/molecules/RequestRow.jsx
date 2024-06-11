import StatusText from '@/components/atoms/Text/StatusText.jsx'

const RequestRow = ({request}) => {
  const rowStyle = 'flex border-b-2 border-b-yellow-500 p-1 pr-3 pl-2 justify-between'
  const requestTextStyle = 'text-xs text-black text-left'
  return (
    <div className={rowStyle}>
      <span className={requestTextStyle}>{request.text}</span>
      <StatusText status={request.status} />
    </div>
  )
}

export default RequestRow