const StatusText = ({status}) => {
  const processingStyle = 'text-xs text-rose-700 w-[42px] text-right'
  const resolvedStyle = 'text-xs text-blue-700'
  const statusText = status === 'processing' ? '처리중' : '완료'
  return (
    <span className={status === 'processing' ? processingStyle : resolvedStyle}>{statusText}</span>
  )
}

export default StatusText