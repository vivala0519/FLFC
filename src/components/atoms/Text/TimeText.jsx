const TimeText = (props) => {
  const { text } = props
  const textStyle = 'w-[30px] text-[12px] font-dnf-forged text-gray-600 dark:text-gray-200 relative'
  return (
    <span className={textStyle}>{text}</span>
  )
}

export default TimeText