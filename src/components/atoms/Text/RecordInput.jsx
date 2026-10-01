const RecordInput = (props) => {
  const { type, setData, handleKeyDown, handleBlur, ariaLabel, disabled = false } = props
  const inputStyle =
    'font-dnf-forged relative right-1 w-16 border-double border-0 border-b-[1px] border-blue-600 dark:border-blue-300 text-center outline-none z-1 bg-transparent'

  const onChangeHandler = (e) => {
    setData(e.target.value)
  }

  return (
    <input
      aria-label={ariaLabel}
      disabled={disabled}
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
