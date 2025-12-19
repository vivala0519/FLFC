const SelectTeamPopup = (props) => {
  const {weeklyTeamData, setShowSelectTeamPopup, playingTeams, setPopupType, setPlayingTeams, selectTeamPopupMessage} = props
  const popupContainer = 'fixed inset-0 flex items-center justify-center z-50'
  const innerContainer = 'bg-white dark:bg-black/90 rounded-xl shadow-lg p-6 w-[90%] h-[80%] flex flex-col justify-center gap-5'
  const teamDiv = 'h-[25%] w-full border-2 border-gray-200 flex flex-col justify-center items-center rounded-md'
  const buttonDiv = 'h-[50px] flex justify-center items-center text-black rounded-md'

  const toggleTeam = (index) => {
    const team = String(index)
    setPlayingTeams((prev) => {
      const next = new Set(prev)

      if (next.has(team)) {
        next.delete(team)
        return next
      }

      if (next.size >= 2) {
        return prev
      }

      next.add(team)
      return next
    })
  }

  const buttonClickHandler = () => {
    selectTeamPopupMessage === '경기 중인 팀을 선택해주세요' ? setPopupType('playing') : setPopupType('exit')
    if (playingTeams.size >= 2) setShowSelectTeamPopup(false)
  }

  return (
    <div className={popupContainer}>
      <div className={innerContainer}>
        <span className={'text-lg'}>{selectTeamPopupMessage}</span>
        {Object.values(weeklyTeamData?.data)?.map((data, index) => {
          const isSelected = playingTeams.has(String(index + 1))
          return (
            <div
              key={index}
              onClick={() => toggleTeam(index + 1)}
              className={
                teamDiv +
                (isSelected
                  ? ' border-yellow-400 text-blue-700 bg-yellow-200 dark:bg-white dark:text-yellow-400'
                  : ' border-gray-200')
              }
            >
              <span className="mb-1">{index + 1}팀</span>
              <span>{data.join(' ')}</span>
            </div>
          )
        })}
        <div className={buttonDiv + (playingTeams.size >= 2 ? ' bg-yellow-200 animate-pulse' : ' bg-gray-200')} onClick={buttonClickHandler}>확인</div>
      </div>
    </div>
  )
}

export default SelectTeamPopup