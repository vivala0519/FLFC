import Swal from 'sweetalert2'
import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { db } from '../../../../firebase.js'
import getTimes from '../../../hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'
import { collection, getDocs } from 'firebase/firestore'

// import Separator from '../../atoms/Separator.jsx'
// import TestingMark from '../../atoms/Text/TestingMark.jsx'
import TapTitleText from '@/components/atoms/Text/TapTitleText.jsx'
// import ThisWeekVoteStatisticsBox from '@/components/organisms/ThisWeekVoteStatisticsBox.jsx'

import left from '@/assets/left.png'
import right from '@/assets/right.png'
import write from '@/assets/write.png'
import check from '@/assets/check.png'
import './WeeklyTeam.css'

function WeeklyTeam(props) {
  const { time: { currentTime }} = getTimes()
  const { totalWeeklyTeamData} = getRecords()
  // const { thisYear } = getTimes
  const { setRegisteredTeam } = props
  const [weeklyTeamData, setWeeklyTeamData] = useState([])
  const [lastDate, setLastDate] = useState('')
  const [page, setPage] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [canCreate, setCanCreate] = useState(true)
  const [activeBorder, setActiveBorder] = useState(false)
  const [inputTeamData, setInputTeamData] = useState([
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
  ])
  const [balancer, setBalancer] = useState('')
  const { membersNickName } = getMembers()
  const selectedWeeklyTeam = weeklyTeamData[page]
  const latestWeeklyTeam = weeklyTeamData[weeklyTeamData.length - 1]
  const isOffDay = (totalWeeklyTeamData?.find((team) => team.id === selectedWeeklyTeam?.id)
    ?? selectedWeeklyTeam)?.data?.isOffDay === true
  const latestTeamIsOffDay = (totalWeeklyTeamData?.find((team) => team.id === latestWeeklyTeam?.id)
    ?? latestWeeklyTeam)?.data?.isOffDay === true

  const tapContainerStyle = 'relative w-full h-[80vh]'
  const dayTitleContainerStyle = 'flex gap-5 justify-center items-center'
  const kakaoButtonDivStyle =
    'flex gap-[5px] items-center justify-center mt-[20px] cursor-pointer'
  const kakaoButtonStyle = 'bg-kakao bg-[length:100%_100%] w-[40px] h-[40px]'

  const today = currentTime
  const currentDay = today.getDay()
  const daysUntilSunday = 7 - currentDay
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + daysUntilSunday)

  const sundayYear = String(nextSunday.getFullYear()).slice(2, 4)
  const sundayDate = nextSunday.getDate()
  const sundayMonth = nextSunday.getMonth() + 1

  useEffect(() => {
    if (editMode || !Array.isArray(totalWeeklyTeamData)) return
    setWeeklyTeamData(totalWeeklyTeamData)
    const lastPage = Math.max(0, totalWeeklyTeamData.length - 1)
    setPage((currentPage) => currentPage === null ? lastPage : Math.min(currentPage, lastPage))
    setLastDate(totalWeeklyTeamData[totalWeeklyTeamData.length - 1]?.id ?? '')
  }, [totalWeeklyTeamData, editMode])

  useEffect(() => {
    let active = true
    const fetchBalancer = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'balancer'))
        if (active) setBalancer(snapshot.docs[0]?.data()?.name ?? '')
      } catch (error) {
        console.error('황밸 요정 정보를 가져오지 못했습니다:', error)
      }
    }
    fetchBalancer()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const kakao = window.Kakao
    const apiKey = import.meta.env.VITE_KAKAO_API_KEY
    if (kakao && apiKey && !kakao.isInitialized()) {
      kakao.init(apiKey)
    }
  }, [])

  const shareKakao = () => {
    if (isOffDay || latestTeamIsOffDay) return
    if (window.Kakao?.isInitialized() && latestWeeklyTeam) {
      const thisWeekTeam = weeklyTeamData[weeklyTeamData.length - 1]
      const firstTeam = (thisWeekTeam.data[1] ?? []).join(' ')
      const secondTeam = (thisWeekTeam.data[2] ?? []).join(' ')
      const thirdTeam = (thisWeekTeam.data[3] ?? []).join(' ')
      const kakao = window.Kakao

      kakao.Share.sendCustom({
        templateId: 110111,
        templateArgs: {
          date:
            Number(thisWeekTeam.id.slice(2, 4)) +
            '월 ' +
            Number(weeklyTeamData[page]?.id.slice(4, 6)) +
            '일',
          firstTeam: firstTeam,
          secondTeam: secondTeam,
          thirdTeam: thirdTeam,
        },
      })
    }
  }

  useEffect(() => {
    if (!lastDate) {
      setCanCreate(true)
      setActiveBorder(false)
      return
    }
    if (lastDate) {
      const lastDateYear = parseInt('20' + lastDate.slice(0, 2))
      const lastDateMonth = parseInt(lastDate.slice(2, 4), 10) - 1
      const lastDateDay = parseInt(lastDate.slice(4, 6), 10)

      const lastTeamDate = new Date(lastDateYear, lastDateMonth, lastDateDay)
      lastTeamDate.setHours(10, 0, 0, 0)

      setCanCreate(![0, 1, 2].includes(currentDay) && lastTeamDate <= currentTime)
      setActiveBorder(lastTeamDate > currentTime)
    }
  }, [lastDate, currentDay, currentTime])

  useEffect(() => {
    if (isOffDay) setEditMode(false)
  }, [isOffDay])

  const pageMoveHandler = (left) => {
    if (left && page > 0) {
      setPage(page - 1)
      return
    }
    if (!left && page < weeklyTeamData.length - 1) {
      setPage(page + 1)
    }
  }

  const teamMakerInputHandler = (event, teamIndex, playerIndex) => {
    const value = event.target.value.trim()
    const newTeamData = [...inputTeamData]
    newTeamData[teamIndex][playerIndex] = value
    setInputTeamData(newTeamData)
  }

  const createWeeklyTeamHandler = (isNew) => {
    if (!isNew && (isOffDay || latestTeamIsOffDay)) return
    // 첫 생성
    if (isNew) {
      const newWeeklyTeam = {
        id: `${sundayYear}${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`,
        data: {
          1: [],
          2: [],
          3: [],
        },
      }
      if (newWeeklyTeam.id !== latestWeeklyTeam?.id) {
        setWeeklyTeamData([...weeklyTeamData, newWeeklyTeam])
        setPage(weeklyTeamData.length)
        setEditMode(true)
      } else {
        Swal.fire({
          icon: 'error',
          title: '이미 생성된 주차입니다.',
        })
      }
    } else {
      // 수정
      setInputTeamData([
        latestWeeklyTeam?.data[1] ?? ['', '', '', '', '', ''],
        latestWeeklyTeam?.data[2] ?? ['', '', '', '', '', ''],
        latestWeeklyTeam?.data[3] ?? ['', '', '', '', '', ''],
      ])
      setEditMode(true)
    }
  }

  const registerTeamHandler = () => {
    if (isOffDay || latestTeamIsOffDay) return
    const newWeeklyTeamData = [...weeklyTeamData]
    const replacedTeamData = inputTeamData.map(team =>
        team.map(name => membersNickName[name]?.slice(1) ?? name)
    )
    const newData = {
      ...newWeeklyTeamData[weeklyTeamData.length - 1].data,
      1: replacedTeamData[0],
      2: replacedTeamData[1],
      3: replacedTeamData[2],
    }

    newWeeklyTeamData[weeklyTeamData.length - 1].data = newData
    setRegisteredTeam(weeklyTeamData[weeklyTeamData.length - 1])
    setWeeklyTeamData(newWeeklyTeamData)
    setEditMode(false)
    setCanCreate(false)
  }

  const displayDateText = (value) => {
    if (value) {
      return (
        Number(value.slice(2, 4)) +
        '월 ' +
        Number(value.slice(4, 6)) +
        '일 Weekly Team'
      )
    }
  }

  if (!Array.isArray(totalWeeklyTeamData) || page === null) {
    return (
      <div className="flex w-full justify-center py-16 text-gray-500 dark:text-gray-400" role="status">
        주간 팀을 불러오는 중입니다
      </div>
    )
  }

  return (
    <div className={tapContainerStyle}>
      {/*{editMode && (*/}
      {/*  <div className="relative">*/}
      {/*<TestingMark locationStyle="absolute top-2 right-0 text-[30px]" />*/}
      {/*<ThisWeekVoteStatisticsBox*/}
      {/*  nextSunday={`${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`}*/}
      {/*/>*/}
      {/*</div>*/}
      {/*)}*/}
      <div className={dayTitleContainerStyle}>
        {!editMode && <LeftButton onClick={() => pageMoveHandler(true)} $show={page > 0} />}
        <TapTitleText active={page === weeklyTeamData.length - 1 && activeBorder} title={displayDateText(weeklyTeamData[page]?.id)} />
        {!editMode && <RightButton onClick={() => pageMoveHandler(false)} $show={page < weeklyTeamData.length - 1} />}
      </div>
      <div className="flex flex-col">
        {!editMode && (
          <div className="flex flex-col items-end mb-5">
            <hr className="w-full border-blue-700" />
          </div>
        )}
        {page === weeklyTeamData.length - 1 && <div className="mb-4">이번 달 황밸 요정🧚 : {balancer}</div>}
        {!weeklyTeamData.length ? (
          <p role="status" className="py-8 text-gray-500 dark:text-gray-400">등록된 주간 팀이 없습니다.</p>
        ) : isOffDay ? (
          <p role="status" className="mb-5 flex min-h-32 items-center justify-center text-sm font-medium text-blue-700 dark:text-yellow-400">
            이번주는 경기가 없습니다🍃
          </p>
        ) : (
          <div className="w-full flex justify-center mb-5">
            <div
              className={`w-fit flex justify-center ${page === weeklyTeamData.length - 1 && activeBorder && 'border-2 rounded-md border-[#bb2649] animate-pulse p-2'}`}
            >
              <div className="flex flex-col gap-5 items-start p-1 rounded-md">
                {!editMode ? (
                  [1, 2, 3].map((team, index) => (
                    <div key={index} className="flex gap-5">
                      <span style={{ width: '25px' }} className="relative left-1 flex items-center">
                        {team}팀
                      </span>
                      <div className="flex gap-[10px]">
                        {weeklyTeamData[page]?.data[team]?.map((player, idx) => (
                          <span key={idx} className="whitespace-pre flex items-center">
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // 팀 생성 모드
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 items-center">
                      {inputTeamData?.map((team, index) => (
                        <div key={index} className="flex flex-col gap-2">
                          <span style={{ width: '25px' }} className="w-full text-left text-black relative left-1">
                            {index + 1}팀
                          </span>
                          <div className="flex gap-1">
                            {team.map((player, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={player}
                                className="w-12 border-blue-600 border-2 outline-none text-center"
                                onChange={(event) => teamMakerInputHandler(event, index, idx)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex justify-center">
          {canCreate ? (
            !editMode ? (
              (!weeklyTeamData.length || page === weeklyTeamData.length - 1) && (
                <div>
                  <div
                    className="flex block-border bg-gray-50 cursor-pointer justify-center items-center"
                    onClick={() => createWeeklyTeamHandler(true)}
                    style={{
                      fontFamily: 'DNFForgedBlade',
                      width: '188px',
                      height: '45px',
                      borderRadius: '3px',
                    }}
                  >
                    <span className="animate-bounceUpDown text-black">이번 주 팀 생성하기</span>
                    <Write />
                  </div>
                </div>
              )
            ) : (
              <div
                className="flex block-border bg-gray-50 cursor-pointer justify-center items-center"
                onClick={registerTeamHandler}
                style={{
                  fontFamily: 'DNFForgedBlade',
                  width: '188px',
                  height: '45px',
                  borderRadius: '3px',
                }}
              >
                <span className="text-black">등록하기</span>
                <Register />
              </div>
            )
          ) : !activeBorder ? (
            currentDay !== 0 && (
              <div className="flex flex-col mt-3">
                <p
                  className="mb-1 text-gray-400"
                  style={{
                    filter: 'drop-shadow(2px 4px 7px grey)',
                    fontFamily: 'DNFForgedBlade',
                  }}
                >
                  팀 생성하기
                </p>
                <p className="text-xs" style={{ fontFamily: 'DNFForgedBlade' }}>
                  Open : 참여투표 종료 후
                </p>
              </div>
            )
          ) : editMode ? (
            <div
              className="flex block-border bg-gray-50 cursor-pointer justify-center items-center"
              style={{
                fontFamily: 'DNFForgedBlade',
                width: '188px',
                height: '45px',
                borderRadius: '3px',
              }}
              onClick={registerTeamHandler}
            >
              <span className="text-black">등록하기</span>
              <Register />
            </div>
          ) : (
            !isOffDay &&
            !latestTeamIsOffDay &&
            [0, 4, 5, 6, 7].includes(currentDay) && (
              <div>
                <div
                  className="flex block-border bg-gray-50 cursor-pointer justify-center items-center"
                  style={{
                    fontFamily: 'DNFForgedBlade',
                    width: '188px',
                    height: '45px',
                    borderRadius: '3px',
                  }}
                  onClick={() => createWeeklyTeamHandler(false)}
                >
                  <span className="text-black">수정</span>
                </div>
                <div className={kakaoButtonDivStyle} onClick={shareKakao}>
                  <p>카톡에 공유하기</p>
                  <button className={kakaoButtonStyle} />
                </div>
              </div>
            )
          )}
        </div>
        {/*{!editMode && (*/}
        {/*  <div className="relative">*/}
        {/*    <div className="mb-10" />*/}
        {/*    {page === weeklyTeamData.length - 1 && (*/}
        {/*      <Separator fullWidth={true} />*/}
        {/*    )}*/}
        {/*<TestingMark locationStyle="absolute top-14 right-0 text-[30px]" />*/}
        {/*<div className="mt-4">*/}
        {/*  {!editMode && page === weeklyTeamData.length - 1 && (*/}
        {/*    <ThisWeekVoteStatisticsBox*/}
        {/*      nextSunday={`${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`}*/}
        {/*    />*/}
        {/*  )}*/}
        {/*</div>*/}
        {/*</div>*/}
        {/*)}*/}
      </div>
    </div>
  )
}

export default WeeklyTeam

const LeftButton = styled.div`
  visibility: ${(props) => (props.$show ? 'visible' : 'hidden')};
  background: url(${left}) no-repeat center center;
  background-size: 100% 100%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  @media (max-width: 812px) {
    width: 15px;
    height: 15px;
  }
  html.dark & {
    filter: invert(1);
  }
`

const Week = styled.span`
  ${(props) => props.$thisWeek && 'color: #bb2649;'}
`

const RightButton = styled.div`
  visibility: ${(props) => (props.$show ? 'visible' : 'hidden')};
  background: url(${right}) no-repeat center center;
  background-size: 100% 100%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  @media (max-width: 812px) {
    width: 15px;
    height: 15px;
  }
  html.dark & {
    filter: invert(1);
  }
`

const Write = styled.div`
  background: url(${write}) no-repeat center center;
  background-size: 100% 100%;
  width: 20px;
  height: 20px;
  position: relative;
  left: 7px;
`

const Register = styled.div`
  background: url(${check}) no-repeat center center;
  background-size: 100% 100%;
  width: 20px;
  height: 20px;
  position: relative;
  left: 7px;
`
