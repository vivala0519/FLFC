const RecordTypeText = (props) => {
  const {type, fontSize, width, customStyle, sliceText} = props
  const divStyle = 'flex'
  const textStyle = ` flex justify-center mr-0.5 font-dnf-forged ${!customStyle && 'relative bottom-2'} ${fontSize ? `text-[${fontSize}]`: ''} text-goal dark:text-yellow-400 ${width ? 'w-[70px]' : ''}`

  return (
    <div className={divStyle}>
      <span className={customStyle + textStyle}>{sliceText ? type.slice(0, sliceText) : type}</span>
    </div>
  )
}

export default RecordTypeText