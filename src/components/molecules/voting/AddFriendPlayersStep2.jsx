const AddFriendPlayersStep2 = (props) => {
  const { additionalPlayerCount, setAdditionalPlayerCount } = props

  const elementStyle = 'flex items-center justify-center gap-4 mt-4 mb-4'
  const buttonStyle = 'h-[30px] pl-3 pr-3 pt-0 pb-0 bg-gray-200'

  const decreaseHandler = () => {
    if (additionalPlayerCount > 1) {
      setAdditionalPlayerCount(additionalPlayerCount - 1)
    }
  }

  const increaseHandler = () => {
    if (additionalPlayerCount < 5) {
      setAdditionalPlayerCount(additionalPlayerCount + 1)
    }
  }

  return (
    <div className={elementStyle}>
      <span>용병</span>
      <button className={buttonStyle} onClick={decreaseHandler}>
        -
      </button>
      <span>{additionalPlayerCount}</span>
      <button className={buttonStyle} onClick={increaseHandler}>
        +
      </button>
      <span>명</span>
    </div>
  )
}

export default AddFriendPlayersStep2
