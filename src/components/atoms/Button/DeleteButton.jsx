const DeleteButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'absolute -right-1 top-1 cursor-pointer text-red-500'

  return (
    <div className={buttonStyle} onClick={clickHandler}>X</div>
  )
}

export default DeleteButton