import { useState } from 'react'
import LetsRecord from './ParentTap/LetsRecord.jsx'
import StatusBoard from './ParentTap/StatusBoard.jsx'
import RecordRoom from './ParentTap/RecordRoom.jsx'
import WeeklyTeam from './ParentTap/WeeklyTeam.jsx'

const TapTemplate = (props) => {
  const {
    test,
    open,
    setOpen,
    tap,
    setTap,
    recordData,
    analyzedData,
    weeklyTeamData,
    setRegisteredTeam,
    headerHeight,
  } = props
  const [startX, setStartX] = useState(null)
  const [moveX, setMoveX] = useState(null)
  const [isLastElementInViewport, setIsLastElementInViewport] = useState(false)
  const [isFirstElementInViewport, setIsFirstElementInViewport] =
    useState(false)
  const testWeeklyTeamData = {
    "id": "251219",
    "data": {
      "1": [
        "승호",
        "영진",
        "지원",
        "원효",
        "용병",
        "승호용병"
      ],
      "2": [
        "희재",
        "승진",
        "원진",
        "용병",
        "대열",
        "건휘"
      ],
      "3": [
        "희철",
        "용",
        "근원",
        "장식",
        "종우",
        "우진"
      ]
    }
  }

  // 슬라이드 시 탭 이동
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    setMoveX(e.touches[0].clientX)

    if (tap === 1) {
      const isElementInViewport = (element) => {
        const rect = element.getBoundingClientRect()
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <=
            (window.innerWidth || document.documentElement.clientWidth)
        )
      }

      const firstElement = document.getElementById('first_element')
      const lastElement = document.getElementById('last_element')
      setIsFirstElementInViewport(isElementInViewport(firstElement))
      setIsLastElementInViewport(isElementInViewport(lastElement))
    }
  }

  const handleTouchMove = (e) => {
    setMoveX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    const diff = startX - moveX
    if (diff > 75) {
      const nextTap = tap < 3 ? tap + 1 : 0
      if (tap !== 1 || (tap === 1 && isLastElementInViewport)) {
        setTap(nextTap)
      }
    } else if (diff < -75) {
      const prevTap = tap > 0 ? tap - 1 : 3
      if (tap !== 1 || (tap === 1 && isFirstElementInViewport)) {
        setTap(prevTap)
      }
    }
    setStartX(null)
    setMoveX(null)
    setIsLastElementInViewport(false)
    setIsFirstElementInViewport(false)
  }

  return (
    <div
      className="w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {tap === 0 && (
        <LetsRecord
          headerHeight={headerHeight}
          setOpen={setOpen}
          open={open}
          recordData={recordData}
          // weeklyTeamData={weeklyTeamData[weeklyTeamData.length - 1]}
          weeklyTeamData={testWeeklyTeamData}
          setTap={setTap}
        />
      )}
      {tap === 1 && (
        <StatusBoard propsData={recordData} analyzedData={analyzedData} />
      )}
      {tap === 2 && (
        <RecordRoom
          propsData={recordData}
          analyzedData={analyzedData}
          test={test}
        />
      )}
      {tap === 3 && (
        <WeeklyTeam
          test={test}
          propsData={weeklyTeamData}
          setRegisteredTeam={setRegisteredTeam}
        />
      )}
    </div>
  )
}

export default TapTemplate
