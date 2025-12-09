const RecordTypeText = (props) => {
  const {type, fontSize, width, customStyle, sliceText} = props
  const divStyle = 'flex'
  const textStyle = ` flex justify-center relative bottom-2 mr-0.5 font-giants ${fontSize ? `text-[${fontSize}]`: ''} text-goal ${width ? 'w-[70px]' : ''}`

  return (
    <div className={divStyle}>
      <span className={customStyle + textStyle}>{sliceText ? type.slice(0, sliceText) : type}</span>
    </div>
  )
}

export default RecordTypeText