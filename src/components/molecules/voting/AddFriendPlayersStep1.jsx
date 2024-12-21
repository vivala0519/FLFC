const AddFriendPlayersStep1 = (props) => {
  const { setGuestType } = props
  const elementStyle = 'flex items-center justify-center gap-6 mt-2 mb-2'
  const buttonStyle =
    'w-[120px] border-2 border-double border-yellow-400 rounded-md h-[80px] pl-3 pr-3 pt-0 pb-0 bg-white text-black'

  const nextStepHandler = (type) => {
    setGuestType(type)
  }

  return (
    <div className={elementStyle}>
      <button className={buttonStyle} onClick={() => nextStepHandler('guest')}>
        외부
      </button>
      <button className={buttonStyle} onClick={() => nextStepHandler('friend')}>
        지인
      </button>
    </div>
  )
}

export default AddFriendPlayersStep1
