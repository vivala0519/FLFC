import { useEffect, useState } from 'react'

const SelectScorerTeamPopup = (props) => {
  const {weeklyTeamData, scorerTeam, setScorerTeam, setShowSelectScorerTeamPopup, setHandleRoundWinnerTrigger, selectScorerTeamPopupMessage, playingTeams} = props
  const popupContainer = 'fixed inset-0 flex items-center justify-center z-50'
  const innerContainer = 'bg-white dark:bg-black/90 rounded-xl shadow-lg p-6 w-[90%] h-[80%] flex flex-col justify-center gap-5'
  const teamDiv = 'h-[25%] w-full border-2 border-gray-200 flex flex-col justify-center items-center rounded-md'
  const buttonDiv = 'h-[50px] flex justify-center items-center text-black rounded-md'
  const [currentTeams, setCurrentTeams] = useState({})

  useEffect(() => {
    const filteredData = Object.fromEntries(
      Object.entries(weeklyTeamData.data).filter(([key]) => [...playingTeams].map(String).includes(String(key)))
    )
    console.log(filteredData)
    console.log(Object.entries(filteredData))
    setCurrentTeams(filteredData)
  }, [playingTeams])

  const toggleTeam = (key) => {
    setScorerTeam(key)
  }

  const buttonClickHandler = () => {
    setShowSelectScorerTeamPopup(false)
    if (selectScorerTeamPopupMessage === '가위바위보 어느 팀이 이겼나요?') {
      setHandleRoundWinnerTrigger(scorerTeam)
    }
  }

  return (
    <div className={popupContainer}>
      <div className={innerContainer}>
        <span>{selectScorerTeamPopupMessage}</span>
        {Object.entries(currentTeams)?.map((data, index) => {
          const isSelected = data[0] === scorerTeam
          return (
            <div
              key={index}
              onClick={() => toggleTeam(data[0])}
              className={
                teamDiv +
                (isSelected
                  ? ' border-yellow-400 text-blue-700 bg-yellow-200 dark:bg-white dark:text-yellow-400'
                  : ' border-gray-200')
              }
            >
              <span className="mb-1">{data[0]}팀</span>
              <span>{data[1].join(' ')}</span>
            </div>
          )
        })}
        <div className={buttonDiv + (scorerTeam ? ' bg-yellow-200 animate-pulse' : ' bg-gray-200')} onClick={buttonClickHandler}>확인</div>
      </div>
    </div>
  )
}

export default SelectScorerTeamPopup