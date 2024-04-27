import {useEffect, useState} from 'react'
import styled from "styled-components"
import Swal from "sweetalert2"
import left from "@/assets/left.png"
import right from "@/assets/right.png"
import write from "@/assets/write.png"
import check from "@/assets/check.png"
import './WeeklyTeam.css'
import {collection, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";

function WeeklyTeam(props) {
    const {setRegisteredTeam, setTap, setShowFooter} = props
    const [weeklyTeamData, setWeeklyTeamData] = useState([])
    const [lastDate, setLastDate] = useState('')
    const [page, setPage] = useState(0)
    const [editMode, setEditMode] = useState(false)
    const [canCreate, setCanCreate] = useState(true)
    const [activeBorder, setActiveBorder] = useState(false)
    const [inputTeamData, setInputTeamData] = useState([['', '', '', '', '', ''], ['', '', '', '', '', ''], ['', '', '', '', '', '']])

    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const daysUntilSunday = 7 - currentDayOfWeek
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilSunday)

    const sundayDate = nextSunday.getDate()
    const sundayMonth = nextSunday.getMonth() + 1

    const fetchWeeklyTeamData = async () => {
        const weeklyTeamRef = collection(db, 'weeklyTeam')
        const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
        const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        setWeeklyTeamData(fetchedWeeklyTeamData)
        setPage(fetchedWeeklyTeamData.length -1)
        setLastDate(fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id)
    }

    useEffect(() => {
        fetchWeeklyTeamData()

        if (currentDayOfWeek < 4) {
            setCanCreate(false)
        }
        if (lastDate) {
            const lastDateMonth = parseInt(lastDate.slice(0, 2), 10) - 1
            const lastDateDay = parseInt(lastDate.slice(2, 4), 10) + 1

            const lastTeamDate = new Date(today.getFullYear(), lastDateMonth, lastDateDay)

            if (lastTeamDate > today) {
                setActiveBorder(true)
                setCanCreate(false)
            }
        }
    }, [lastDate]);

    useEffect(() => {
        if (!editMode) {
            fetchWeeklyTeamData()
        } else {
            setShowFooter(false)
        }
    }, [editMode]);

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

    const createWeeklyTeamHandler = (isNew) => {
        // 첫 생성
        if (isNew) {
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
                Swal.fire({
                    icon: "error",
                    title: "이미 생성된 주차입니다.",
                })
            }
        } else {// 수정
            setInputTeamData([weeklyTeamData[weeklyTeamData.length - 1].data[1], weeklyTeamData[weeklyTeamData.length - 1].data[2], weeklyTeamData[weeklyTeamData.length - 1].data[3]])
            setEditMode(true)
        }
    }

    const registerTeamHandler = () => {
        const newWeeklyTeamData = [...weeklyTeamData]
        const newData = {1: inputTeamData[0], 2: inputTeamData[1], 3: inputTeamData[2]}
        let canRegister = true;
        // Object.values(newData).forEach(team => {
            // const players = team.filter(player => player.trim())
            // if (players.length < 5) {
            //     canRegister = false;
            // }})

        if (canRegister) {
            newWeeklyTeamData[weeklyTeamData.length - 1].data = newData
            setRegisteredTeam(weeklyTeamData[weeklyTeamData.length - 1])
            setWeeklyTeamData(newWeeklyTeamData)
            setEditMode(false)
            setCanCreate(false)
        } else {
            Swal.fire({
                icon: "error",
                title: "팀당 최소 5명!",
            })
        }
    }

    useEffect(() => {
        // console.log(page, weeklyTeamData)
    }, [page, weeklyTeamData]);


    // 슬라이드 시 탭 이동
    const [startX, setStartX] = useState(null);
    const [moveX, setMoveX] = useState(null);

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
        setMoveX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setMoveX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        const diff = startX - moveX;
        if (diff > 75) {
            setTap(0)
        } else if (diff < -75) {
            setTap(2)
        }
        setStartX(null);
        setMoveX(null);
    };

    const votedPlayerMonthPlan = []
    const votedPlayerWeekPlan = []

    return (
        <div className='w-full relative' style={{height: '80vh'}}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}>
            <div className='flex gap-5 justify-center items-center'>
                {!editMode && <LeftButton onClick={() => pageMoveHandler(true)} $show={page !== 0}/>}
                <Week $thisWeek={page === weeklyTeamData.length - 1 && activeBorder}
                      className='mt-3 mb-1 underline underline-offset-1 relative bottom-1'
                      style={{fontFamily: 'DNFForgedBlade'}}>{weeklyTeamData[page]?.id.slice(0, 2) + '월' + weeklyTeamData[page]?.id.slice(2, 4) + '일 '}{"Weekly Team"}</Week>
                {!editMode &&
                    <RightButton onClick={() => pageMoveHandler(false)} $show={page !== weeklyTeamData.length - 1}/>}
            </div>
            <div className='flex flex-col'>
                <div className='flex flex-col items-end mb-5'>
                    <hr className='w-full border-green-800'/>
                    {/*<RelationButton>관계도</RelationButton>*/}
                </div>
                <div className='w-full flex justify-center mb-5'>
                    <div
                        className={`w-fit flex justify-center ${page === weeklyTeamData.length - 1 && activeBorder && 'custom-border'}`}>
                        <div className='flex flex-col gap-5 items-start bg-white p-3 rounded-md'>
                            {!editMode ?
                                [1, 2, 3].map((team, index) => (
                                    <div key={index} className='flex gap-5'>
                                        <span style={{width: '25px'}}
                                              className='text-black relative left-1'>{team}팀</span>
                                        <div className='flex gap-1'>
                                            {weeklyTeamData[page]?.data[team]?.map((player, idx) => (
                                                <span key={idx} className='text-black'>{player}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                                : // 팀 생성 모드
                                <div className='flex flex-col gap-4'>
                                    <div className='flex flex-col mb-6'>
                                        {/*<span className='mb-4 text-black'>금주 참여 투표 인원 (투표 시간 순)</span>*/}
                                        {/*<div className='mr-2 mb-4'>*/}
                                        {/*    <span className='text-sm text-yellow-600'>월회비 : </span>*/}
                                        {/*    <div className='flex flex-wrap justify-center gap-1'>*/}
                                        {/*        {votedPlayerMonthPlan.map((player, index) => (*/}
                                        {/*              <span className=' text-black' key={index}>{player + ' '}</span>))}*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}
                                        {/*<div className='mr-2'>*/}
                                        {/*    <span className='text-sm text-yellow-600'>주회비 : </span>*/}
                                        {/*    <div className='flex flex-wrap justify-center gap-1'>*/}
                                        {/*        {votedPlayerWeekPlan.map((player, index) => (*/}
                                        {/*            <span className=' text-black' key={index}>{player}</span>))}*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}
                                    </div>
                                    <div className='flex flex-col gap-2 items-center'>
                                        {inputTeamData?.map((team, index) => (
                                            <div key={index} className='flex gap-5'>
                                                <span style={{width: '25px'}}
                                                      className='text-black relative left-1'>{index + 1}팀</span>
                                                <div className='flex gap-1'>
                                                    {team.map((player, idx) => <input key={idx} value={player}
                                                                                      onChange={(event) => teamMakerInputHandler(event, index, idx)}
                                                                                      type='text'
                                                                                      className='w-12 border-green-600 border-2 outline-none text-center'/>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div className='w-full flex justify-center'>
                    {canCreate ?
                        (!editMode ?
                                <div className='flex block-border bg-gray-50 cursor-pointer justify-center items-center'
                                     onClick={() => createWeeklyTeamHandler(true)} style={{
                                    fontFamily: 'DNFForgedBlade',
                                    width: '188px',
                                    height: '45px',
                                    borderRadius: '3px'
                                }}><span className='text-black'>이번 주 팀 생성하기</span><Write/></div>
                                :
                                <div className='flex block-border bg-gray-50 cursor-pointer justify-center items-center'
                                     onClick={registerTeamHandler} style={{
                                    fontFamily: 'DNFForgedBlade',
                                    width: '188px',
                                    height: '45px',
                                    borderRadius: '3px'
                                }}><span className='text-black'>등록하기</span><Register/></div>
                        )
                        :
                        (!activeBorder ?
                                <div className='flex flex-col mt-3'>
                                    <p className='mb-1 text-gray-400'
                                       style={{filter: 'drop-shadow(2px 4px 7px grey)', fontFamily: 'DNFForgedBlade'}}>팀
                                        생성하기</p>
                                    <p className='text-xs' style={{fontFamily: 'DNFForgedBlade'}}>Open : 참여투표 종료 후</p>
                                </div>
                                :
                                editMode ?
                                    <div
                                        className='flex block-border bg-gray-50 cursor-pointer justify-center items-center'
                                        style={{
                                            fontFamily: 'DNFForgedBlade',
                                            width: '188px',
                                            height: '45px',
                                            borderRadius: '3px'
                                        }} onClick={registerTeamHandler}><span
                                        className='text-black'>등록하기</span><Register/></div>
                                    :
                                    currentDayOfWeek <= 6 && currentDayOfWeek > 3 && <div
                                        className='flex block-border bg-gray-50 cursor-pointer justify-center items-center'
                                        style={{
                                            fontFamily: 'DNFForgedBlade',
                                            width: '188px',
                                            height: '45px',
                                            borderRadius: '3px'
                                        }} onClick={() => createWeeklyTeamHandler(false)}><span
                                        className='text-black'>수정</span></div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default WeeklyTeam


const LeftButton = styled.div`
    visibility: ${props => props.$show ? 'visible' : 'hidden'};
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
    ${props => props.$thisWeek && 'color: #EAB308;'}
`

const RightButton = styled.div`
    visibility: ${props => props.$show ? 'visible' : 'hidden'};
    background: url(${right}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 15px;
        height: 15px;
    };
    @media (prefers-color-scheme: dark) {
        filter: invert(1);
    };
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

const RelationButton = styled.button`
    position: relative;
    top: 10px;
    width: 60px;
    height: 30px;
    font-size: 10px;
`