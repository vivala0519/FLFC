const SelectElement = (props) => {
  const { text, clickHandler, inputMode } = props

  const elementStyle =
    'border-2 flex justify-center items-center rounded-md ' +
    (text !== '취소'
      ? text === '등록'
        ? 'h-12 w-full border-yellow-400'
        : 'h-14 w-full border-yellow-400'
      : inputMode
        ? 'border-red-300 h-8 mt-2'
        : 'border-red-300 h-12')

  return (
    <div className={elementStyle} onMouseDown={clickHandler}>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  )
}

export default SelectElement
