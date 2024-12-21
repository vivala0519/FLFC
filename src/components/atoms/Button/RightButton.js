const RightButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'absolute -right-1 top-1 cursor-pointer'

  return (
      <div className={buttonStyle} onClick={clickHandler}>X</div>
  )
}

export default RightButton