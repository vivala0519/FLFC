const RecordTypeText = (props) => {
  const {type, fontSize, width, customStyle} = props
  const textStyle = ` flex justify-center relative bottom-2 mr-0.5 font-giants ${fontSize ? `text-[${fontSize}]`: ''} ${type === 'GOAL' ? 'text-goal' : 'text-assist'} ${width ? 'w-[70px]' : ''}`

  return (
    <span className={customStyle + textStyle}>{type}</span>
  )
}

export default RecordTypeText