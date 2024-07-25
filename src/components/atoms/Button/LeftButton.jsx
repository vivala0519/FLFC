const LeftButton = (props) => {
  const { show, clickHandler } = props
  const buttonStyle = 'bg-left bg-[length:100%_100%] w-25 h-25 cursor-pointer mobile:w-[30px] h-[30px] ' + (show ? 'visible' : 'hidden')

  return (
    <div className={buttonStyle} onClick={clickHandler}></div>
  )
}

export default LeftButton