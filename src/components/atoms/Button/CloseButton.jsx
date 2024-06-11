const CloseButton = (props) => {
  const { clickHandler } = props
  const buttonStyle = 'dark:bg-black dark:text-white absolute top-0 -right-4 text-xl text-black bg-white cursor-pointer'

  return (
    <div className={buttonStyle} onClick={clickHandler}>X</div>
  )
}

export default CloseButton