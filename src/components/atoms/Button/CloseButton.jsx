const CloseButton = (props) => {
  const { clickHandler, customLocation } = props
  const buttonStyle = 'dark:bg-black dark:text-white text-xl text-black cursor-pointer '

  return (
    <div className={buttonStyle + customLocation} onClick={clickHandler}>X</div>
  )
}

export default CloseButton