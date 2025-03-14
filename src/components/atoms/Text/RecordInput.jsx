const RecordInput = (props) => {
  const { type, setData, handleKeyDown, handleBlur } = props
  const inputStyle =
    'relative right-1 w-24 border-solid border-0 border-b-[1px] border-green-600 text-center outline-none z-1 bg-transparent'

  const onChangeHandler = (e) => {
    setData(e.target.value)
  }

  return (
    <input
      className={inputStyle}
      value={type}
      onChange={onChangeHandler}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      maxLength={2}
    />
  )
}

export default RecordInput
