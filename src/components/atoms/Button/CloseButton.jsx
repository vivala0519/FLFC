const CloseButton = (props) => {
  const { clickHandler, customStyle } = props
  const buttonStyle = ' dark:bg-black dark:text-white text-xl text-black cursor-pointer '

  return (
    <div className={customStyle + buttonStyle} onClick={clickHandler}>X</div>
  )
}

export default CloseButton