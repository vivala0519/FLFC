import {useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import sun from '@/assets/sun2.png'

const Header = (props) => {
  const {tap, setTap, lastDate, setHeaderHeight} = props;
  const tapName = ['기록하기', '현황판', '기록실' ,'이번주 팀']
  const headerRef = useRef(null)
  const [live, setLive] = useState(false)
  const [weeklyTeamLive, setWeeklyTeamLive] = useState(false)

  // Let's Record 탭 Live 뱃지 활성 세팅
  const startTime = new Date()
  startTime.setHours(7, 50, 0, 0)
  const endTime = new Date()
  endTime.setHours(10, 5, 0, 0)
  const currentTime = new Date()
  const day = currentTime.getDay()
  if ([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime) {
    setLive(true)
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
        setWeeklyTeamLive(true)
        if ([0, 7].includes(today.getDay()) &&  currentTime > endTime) {
          setWeeklyTeamLive(false)
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
    <header ref={headerRef} className='flex flex-col items-center w-full top-5'>
      <span className='relative text-green-800'
        style={{
          left: '4px',
          letterSpacing: '3px',
          fontSize: '35px',
          fontFamily: 'Giants-Inline',
          fontStyle: 'normal',
          fontWeight: '400'
        }}
      >
        FLFC
      </span>
      <span className='mb-3 text-yellow-500'
        style={{
          fontSize: '8px',
          fontFamily: 'SUITE-Regular',
          fontStyle: 'normal',
          fontWeight: '200'
        }}>
        Football Love Futsal Club
      </span>
      <div
          className='flex flex-row justify-around w-full border-double border-0 border-b-2 border-t-2 border-green-500 mb-5 p-2'
          style={{fontFamily: 'DNFForgedBlade'}}>
        <div
          className={`relative cursor-pointer w-full ${tap === 0 && 'text-yellow-500'}`}
          onClick={() => setTap(0)}><span className='relative'>{live &&
          <Live $left='-13px'>Live</Live>}{tapName[0]}</span>
        </div>
        <Sun className='spin'/>
        <div
          className={`cursor-pointer w-full ${tap === 1 && 'text-yellow-500'}`}
          onClick={() => setTap(1)}><span className='relative'><Live
          $left='-13px'>Live</Live>{tapName[1]}</span>
        </div>
        <Sun className='spin'/>
        <div
          className={`relative cursor-pointer w-full ${tap === 2 && 'text-yellow-500'}`}
          onClick={() => setTap(2)}>{tapName[2]}
        </div>
        <Sun className='spin'/>
        <div
          className={`relative cursor-pointer w-full ${tap === 3 && 'text-yellow-500'}`}
          onClick={() => setTap(3)}><span className='relative'>{weeklyTeamLive &&
          <Live $left='-13px'>Live</Live>}{tapName[3]}</span>
        </div>
      </div>
    </header>
  )
}


export default Header

const Sun = styled.span`
  position: relative;
  width: 100px;
  height: 24px;
  background-image: url(${sun});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 42% 37%;
`

const Live = styled.span`
  position: absolute;
  left: ${props => props.$left};
  bottom: 16px;
  font-family: 'DNFBitBitv2', serif;
  font-size: 9px;
  color: #bb2649;
  transform: rotate(-17deg);
`