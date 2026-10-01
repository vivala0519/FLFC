const DeleteButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'absolute right-2 bottom-[10px] cursor-pointer text-red-500 dark:text-red-400 decoration-2 decoration-solid decoration-red-200 text-[10px]'

  return (
    <div className={buttonStyle} onClick={clickHandler}>삭제</div>
  )
}

export default DeleteButton