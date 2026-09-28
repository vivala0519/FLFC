const DeleteButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'absolute right-0 bottom-[10px] cursor-pointer text-red-500 dark:text-red-400 underline decoration-2 decoration-solid decoration-red-200 text-xs'

  return (
    <div className={buttonStyle} onClick={clickHandler}>삭제</div>
  )
}

export default DeleteButton