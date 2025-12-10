const DeleteButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'absolute right-2 bottom-[6px] cursor-pointer text-red-500'

  return (
    <div className={buttonStyle} onClick={clickHandler}>X</div>
  )
}

export default DeleteButton