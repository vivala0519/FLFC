const TimeText = (props) => {
  const { text } = props
  const textStyle = 'w-[30px] text-[12px] font-hahmlet text-gray-600'
  return (
    <span className={textStyle}>{text}</span>
  )
}

export default TimeText