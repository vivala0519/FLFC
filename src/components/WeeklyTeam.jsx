import {useEffect, useState} from 'react'
import styled from "styled-components"
import left from "@/assets/left.png"
import right from "@/assets/right.png"

function WeeklyTeam(props) {
    const {propsData, setRegisteredTeam} = props
    const [weeklyTeamData, setWeeklyTeamData] = useState([])
    const [dynamicHeight, setDynamicHeight] = useState(0)
    const [page, setPage] = useState(0)
    const [editMode, setEditMode] = useState(false)
    const [canCreate, setCanCreate] = useState(true)
    const [inputTeamData, setInputTeamData] = useState([['', '', '', '', '', ''], ['', '', '', '', '', ''], ['', '', '', '', '', '']])

    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const daysUntilSunday = 7 - currentDayOfWeek
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilSunday)

    const sundayDate = nextSunday.getDate()
    const sundayMonth = nextSunday.getMonth() + 1

    useEffect(() => {
        setWeeklyTeamData(propsData)
        setPage(propsData.length -  1)

        const lastDate = propsData[propsData.length - 1].id
        const lastDateMonth = parseInt(lastDate.slice(0, 2), 10) - 1
        const lastDateDay = parseInt(lastDate.slice(2, 4), 10) + 1

        const lastTeamDate = new Date(today.getFullYear(), lastDateMonth, lastDateDay)

        if (lastTeamDate > today) {
            setCanCreate(false)
        }

        // 창 높이에 따라 높이 조절
        function setHeight() {
            const height = window.innerHeight - 350
            setDynamicHeight(height)
        }
        setHeight()
        window.addEventListener('resize', setHeight);

        return () => {
            window.removeEventListener('resize', setHeight);
        };
    }, []);

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
        const newTeamData = [...inputTeamData]
        newTeamData[teamIndex][playerIndex] = event.target.value
        setInputTeamData(newTeamData)
    }

    const createWeeklyTeamHandler = () => {
        const newWeeklyTeam = {
            id: `${sundayMonth < 10 ? '0' + sundayMonth : sundayMonth}${sundayDate < 10 ? '0' + sundayDate : sundayDate}`,
            data: {
                1: [],
                2: [],
                3: []
            }
        }
        if (newWeeklyTeam.id !== weeklyTeamData[weeklyTeamData.length - 1].id) {
            setWeeklyTeamData([...weeklyTeamData, newWeeklyTeam])
            setPage(weeklyTeamData.length)
            setEditMode(true)
        } else {
            alert('이미 생성된 주차입니다.')
        }
    }

    const registerTeamHandler = () => {
        const newWeeklyTeamData = [...weeklyTeamData]
        const newData = {1: inputTeamData[0], 2: inputTeamData[1], 3: inputTeamData[2]}

        newWeeklyTeamData[weeklyTeamData.length - 1].data = newData
        setRegisteredTeam(weeklyTeamData[weeklyTeamData.length - 1])
        setWeeklyTeamData(newWeeklyTeamData)
        setEditMode(false)
        setCanCreate(false)
    }

  return (
      <div className='w-full' style={{height: dynamicHeight}}>
          <div className='flex gap-5 justify-center items-center'>
            {!editMode && <LeftButton onClick={() => pageMoveHandler(true)}/>}
            <Week $thisWeek={page === weeklyTeamData.length - 1} className='mt-3 mb-1 underline underline-offset-1 relative bottom-1' style={{fontFamily: 'Giants-Inline'}}>{weeklyTeamData[page]?.id.slice(0, 2) + '월' + weeklyTeamData[page]?.id.slice(2, 4) + '일 '}{"Weekly Team"}</Week>
            {!editMode && <RightButton onClick={() => pageMoveHandler(false)} />}
          </div>
            <hr className='w-full mb-5 border-indigo-600'/>
          <div className='flex flex-col gap-5 items-center'>
              {!editMode ?
                  [1, 2, 3].map((team, index) => (
                  <div key={index} className='flex gap-5'>
                      <span>{team}팀</span>
                      <div className='flex gap-1'>
                          {weeklyTeamData[page]?.data[team].map((player, idx) => (
                              <span key={idx}>{player}</span>
                          ))}
                      </div>
                  </div>
                 ))
              :
                  inputTeamData?.map((team, index) => (
                  <div key={index} className='flex gap-5'>
                      <span>{index + 1}팀</span>
                      <div className='flex gap-1'>
                          {team.map((player, idx) => <input key={idx} value={player} onChange={(event) => teamMakerInputHandler(event, index, idx)} type='text' className='w-12 border-indigo-400 border-2 outline-none text-center'/>)}
                      </div>
                  </div>
              ))
              }
          </div>
          <div className='mt-14'>
              {canCreate &&
                  (!editMode ?
                  <button onClick={createWeeklyTeamHandler}>이번 주 팀 생성하기</button>
                  :
                  <button onClick={registerTeamHandler}>등록하기</button>)
              }
          </div>
      </div>
  )
}

export default WeeklyTeam


const LeftButton = styled.div`
    background: url(${left}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 15px;
        height: 15px;
    }
`

const Week = styled.span`
    ${props => props.$thisWeek && 'color: #BB2649;'}
`

const RightButton = styled.div`
    background: url(${right}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 15px;
        height: 15px;
    }
`