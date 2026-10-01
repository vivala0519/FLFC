const TimeText = (props) => {
  const { text } = props
  const textStyle = 'text-[12px] font-dnf-forged text-gray-600 dark:text-gray-200'
  return (
    <span className={textStyle}>{text}</span>
  )
}

export default TimeText