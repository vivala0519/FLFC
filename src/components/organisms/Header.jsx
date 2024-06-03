import { useEffect, useRef, useState } from 'react'
import HomeButton from '@/components/molecules/HomeButton'
import ParentTapContainer from '@/components/molecules/ParentTapContainer.jsx';

const Header = (props) => {
  const headerRef = useRef(null)
  const headerStyle = 'flex flex-col items-center w-full top-5'

  const {tap, setTap, lastDate, setHeaderHeight} = props;
  const [isLive, setIsLive] = useState(false)
  const [weeklyTeamIsLive, setWeeklyTeamIsLive] = useState(false)
  const tapInfo = {tap: tap, setTap: setTap}
  const liveBadgeInfo = {isLive: isLive, weeklyTeamIsLive: weeklyTeamIsLive}

  // Let's Record 탭 Live 뱃지 활성 세팅
  const startTime = new Date()
  startTime.setHours(7, 50, 0, 0)
  const endTime = new Date()
  endTime.setHours(10, 0, 0, 0)
  const currentTime = new Date()
  const day = currentTime.getDay()
  if ([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime) {
    setIsLive(true)
  }

  // Weekly Team 탭 Live 뱃지 활성 세팅
  useEffect(() => {
    if (lastDate) {
      const lastDateMonth = parseInt(lastDate.slice(0, 2), 10) - 1
      const lastDateDay = parseInt(lastDate.slice(2, 4), 10) + 1
      const today = new Date()
      const lastTeamDate = new Date(today.getFullYear(), lastDateMonth, lastDateDay)
      // 이번주 팀 등록이 이루어진 경우
      if (lastTeamDate > today) {
        setWeeklyTeamIsLive(true)
        if ([0, 7].includes(today.getDay()) &&  currentTime > endTime) {
          setWeeklyTeamIsLive(false)
        }
      }
    }
  }, [lastDate])

  // set header height
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight)
    }
  }, [])

  return (
    <header ref={headerRef} className={headerStyle}>
      <HomeButton />
      <ParentTapContainer tapInfo={tapInfo} liveBadgeInfo={liveBadgeInfo} />
    </header>
  )
}


export default Header