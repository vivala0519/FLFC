const RecordTypeText = (props) => {
  const {type, fontSize, width} = props
  const textStyle = `flex justify-center relative bottom-2 mr-0.5 font-giants ${fontSize ? `text-[${fontSize}]`: ''} ${type === 'GOAL' ? 'text-goal' : 'text-assist'} ${width ? 'w-[70px]' : ''}`

  return (
    <span className={textStyle}>{type}</span>
  )
}

export default RecordTypeText