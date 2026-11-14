import { useEffect, useRef, useState } from 'react'
import HomeButton from '@/components/atoms/Button/HomeButton'
import GoToVoteButton from '@/components/atoms/Button/GoToVoteButton.jsx'
import ParentTapContainer from '@/components/molecules/ParentTapContainer.jsx'
import HeaderPullToRefresh from '@/components/molecules/HeaderPullToRefresh.jsx'
import HeaderFamilyApps from '@/components/organisms/HeaderFamilyApps.jsx'
import MoonIcon from '@/assets/lucide/moon.svg?react'
import SunIcon from '@/assets/lucide/sun.svg?react'
import getTimes from '@/hooks/getTimes.js'
import getRecords from '@/hooks/getRecords.js'
import { getRecordAvailability } from '@/apis/recordAvailability.js'

const Header = (props) => {
  const headerRef = useRef(null)
  const headerStyle = 'flex flex-col items-center w-full top-5'

  const { tap, setTap, lastDate, setHeaderHeight, isDarkMode, onToggleTheme } = props
  const { time } = getTimes()
  const { totalWeeklyTeamData } = getRecords()
  const { canRegister: isLive } = getRecordAvailability(time, totalWeeklyTeamData)
  const [weeklyTeamIsLive, setWeeklyTeamIsLive] = useState(false)
  const latestWeeklyTeam = totalWeeklyTeamData?.[totalWeeklyTeamData.length - 1]
  const weeklyTeamIsOffDay = latestWeeklyTeam?.data?.isOffDay === true
  const tapInfo = { tap: tap, setTap: setTap }
  const liveBadgeInfo = { isLive: isLive, weeklyTeamIsLive: weeklyTeamIsLive && !weeklyTeamIsOffDay }

  // Weekly Team 탭 Live 뱃지 활성 세팅
  useEffect(() => {
    const endTime = new Date()
    endTime.setHours(10, 0, 0, 0)
    const currentTime = new Date()
    if (weeklyTeamIsOffDay) {
      setWeeklyTeamIsLive(false)
      return
    }
    if (lastDate) {
      const lastDateYear = parseInt('20' + lastDate.slice(0, 2))
      const lastDateMonth = parseInt(lastDate.slice(2, 4)) - 1
      const lastDateDay = parseInt(lastDate.slice(4, 6))
      const today = new Date()

      const lastTeamDate = new Date(lastDateYear, lastDateMonth, lastDateDay)
      // 이번주 팀 등록이 이루어진 경우
      if (lastTeamDate > today) {
        setWeeklyTeamIsLive(true)
        if ([0, 7].includes(today.getDay()) && currentTime > endTime) {
          setWeeklyTeamIsLive(false)
        }
      }
    }
  }, [lastDate, weeklyTeamIsOffDay])

  // set header height
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight)
    }
  }, [setHeaderHeight])

  return (
    <header ref={headerRef} className={headerStyle}>
      <HeaderPullToRefresh>
        <HeaderFamilyApps>
          <div className="relative flex w-full flex-col items-center">
            <button
              type="button"
              aria-label="다크모드"
              aria-pressed={Boolean(isDarkMode)}
              title={isDarkMode ? '일반모드로 전환' : '다크모드로 전환'}
              onClick={onToggleTheme}
              className="absolute bottom-2 left-3 inline-flex h-11 w-11 items-center justify-center rounded border-0 bg-transparent p-1 text-gray-900 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-white"
            >
              {isDarkMode ? <SunIcon className="h-7 w-7" aria-hidden="true" /> : <MoonIcon className="h-7 w-7" aria-hidden="true" />}
            </button>
            <HomeButton />
          </div>
        </HeaderFamilyApps>
      </HeaderPullToRefresh>
      {/*<GoToVoteButton />*/}
      <ParentTapContainer tapInfo={tapInfo} liveBadgeInfo={liveBadgeInfo} />
    </header>
  )
}

export default Header
