const SendRequestButton = ({clickHandler}) => {
  const buttonStyle = 'w-2/12 flex items-center content-center justify-center border-2 border-b-0 border-l-0 text-black bg-white'

  return (
    <div className={buttonStyle} onClick={clickHandler}>
      요청
    </div>
  )
}

export default SendRequestButton