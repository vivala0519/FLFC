import {useEffect, useState} from 'react'
import styled from 'styled-components'
import left from '@/assets/left.png'
import right from '@/assets/right.png'
import medal from '@/assets/medal.png'
import goal from '@/assets/goal2.png'
import assist from '@/assets/assist2.png'
import attendance from '@/assets/attendance2.png'

function DataTable(props) {
    const {tap, tableData, analyzedData, page, setPage, month, quarterData, lastSeasonKings} = props

    const [sortedNames, setSortedNames] = useState([])
    const [sortedAbsenteeNames, setSortedAbsenteeNames] = useState([])
    const [quarterName, setQuarterName] = useState('')
    const [winnerList, setWinnerList] = useState([])
    const [kingList, setKingList] = useState([])

    useEffect(() => {
        // console.log('tableData.data', tableData.data)
        // console.log('analyzedData', analyzedData)
        // console.log('quarterData', quarterData)
    }, [tableData])

    useEffect(() => {
        if (analyzedData?.active?.members && tap === '현황판') {
            setSortedNames(analyzedData?.active?.members['active'].sort((a, b) => a.localeCompare(b)))
        }
        setSortedAbsenteeNames(analyzedData?.active?.members['inactive'].sort((a, b) => a.localeCompare(b)))
    }, [analyzedData])

    const extractWinners = (sortedByValue) => {
        const maxValue = Math.max(...sortedByValue.map(name => quarterData.totalData.get(name)[tap]))
        let maxValuePeople = sortedByValue.filter(name => quarterData.totalData.get(name)[tap] === maxValue)
        if (['골', '어시'].includes(tap)) {
            const totalScore = maxValuePeople.map(name => quarterData.totalData.get(name)['골'] + quarterData.totalData.get(name)['어시'] + quarterData.totalData.get(name)['출석'])
            const maxValueOfTotalScore = Math.max(...totalScore)
            const winner = maxValuePeople.filter((name) => totalScore[maxValuePeople.indexOf(name)] === maxValueOfTotalScore)
            setWinnerList(winner)
        } else if (tap === '출석') {
            setWinnerList(maxValuePeople)
        } else {
            setWinnerList([])
        }
    }

    // 탭에 따른 정렬
    useEffect(() => {
        if (quarterData?.members) {
            if (tap === '골') {
                // eslint-disable-next-line no-unsafe-optional-chaining
                const sortedByGoal = [...quarterData.members['active']].sort((a, b) => {
                    const aGoals = quarterData.totalData.get(a)['골'];
                    const bGoals = quarterData.totalData.get(b)['골'];
                    return bGoals - aGoals;
                })
                setSortedNames(sortedByGoal)
                extractWinners(sortedByGoal)
            } else if (tap === '어시') {
                // eslint-disable-next-line no-unsafe-optional-chaining
                const sortedByAssist = [...quarterData.members['active']].sort((a, b) => {
                    const aAssists = quarterData.totalData.get(a)['어시'];
                    const bAssists = quarterData.totalData.get(b)['어시'];
                    return bAssists - aAssists;
                })
                setSortedNames(sortedByAssist)
                extractWinners(sortedByAssist)
            } else if (tap === '출석') {
                // eslint-disable-next-line no-unsafe-optional-chaining
                const sortedByAttendance = [...quarterData.members['active']].sort((a, b) => {
                    const aAttendance = quarterData.totalData.get(a)['출석'];
                    const bAttendance = quarterData.totalData.get(b)['출석'];
                    return bAttendance - aAttendance;
                })
                setSortedNames(sortedByAttendance)
                extractWinners(sortedByAttendance)
            } else {
                setSortedNames(analyzedData?.active?.members['active'].sort((a, b) => a.localeCompare(b)))
            }
        }
    }, [tap, quarterData])

    const findTrophy = (name) => {
        if (lastSeasonKings?.goal_king === name) {
            console.log(name)
            return 'goal'
        }
        if (lastSeasonKings?.assist_king === name) {
            return 'assist'
        }
        if (lastSeasonKings?.attendance_king.includes(name)) {
            return 'attendance'
        }
    }

    useEffect(() => {
        let kings = []
        if (lastSeasonKings) {
            kings = [...lastSeasonKings.attendance_king]
            kings.push(lastSeasonKings.goal_king)
            kings.push(lastSeasonKings.assist_king)
        }

        setKingList(kings)
    }, [lastSeasonKings])
    
    // 페이지에 따른 분기 이름 설정
    useEffect(() => {
        if (page < 3) {
            setQuarterName('1')
        } else if (page < 6) {
            setQuarterName('2')
        } else if (page < 9) {
            setQuarterName('3')
        } else {
            setQuarterName('4')
        }
    }, [page])

    const pageMoveHandler = (left) => {
        if (left && page > 0) {
            setPage(page - 1)
            return
        }
        if (!left && page < month.length - 1) {
            setPage(page + 1)
        }
    }

    return (
        <div>
            {tap !== '현황판' &&
                <MonthContainer className=''>
                    <LeftButton  onClick={() => pageMoveHandler(true)} />
                    <Month className=''>
                        {tableData.month}월
                    </Month>
                    <RightButton   onClick={() => pageMoveHandler(false)} />
                </MonthContainer>
            }
            <TableContainer>
                <Table>
                    {tap === '현황판' ?
                        <TableHeaderStat>
                            <div style={{minWidth: '75px', maxWidth: '75px'}}>이름</div>
                            <div>골</div>
                            <div>골순위</div>
                            <div>{`일평균\n득점`}</div>
                            <div>어시</div>
                            <div>어시순위</div>
                            <div>{`일평균\n어시`}</div>
                            <CustomMinWidthDiv $propsWidth='17%'>공격포인트</CustomMinWidthDiv>
                            <div>순위</div>
                            <div>출석</div>
                            <div>출석순위</div>
                            <CustomMinWidthDiv $propsWidth='26%' $propsMax='9.5%'>{`포인트 총합\n(출석, 어시, 골)`}</CustomMinWidthDiv>
                            <CustomMinWidthDiv $propsWidth='26%' $propsMax='9.5%'>포인트 총합 순위</CustomMinWidthDiv>
                        </TableHeaderStat>
                        :
                        <TableHeaderOther>
                            <div style={{width: '75px'}}>이름</div>
                            {
                                tableData?.data?.map((data) => <span key={data.id}>{Number(data.id.slice(2, 4)) + '일'}</span>)
                            }
                            {<span>{`${quarterName}분기\n총합`}</span>}
                        </TableHeaderOther>
                    }
                    <StyledHR $tap={tap} />
                    <TableBody>
                        {/*실 출석 인원 먼저*/}
                        {
                            sortedNames?.map((name, index) =>
                                (<><TableRowStat key={index}>
                                    {tap === '현황판' ?
                                        <FirstColumn>{kingList.includes(name) && <Trophy $king={findTrophy(name)}/>}<StatusBoardName style={{width: '75px', borderRight: '1px solid #ccc'}}>{name}</StatusBoardName></FirstColumn>
                                        :
                                        <div className='flex items-center justify-center' style={{minWidth: '20%', flex: '1', borderRight: '1px solid #ccc'}}>
                                            {winnerList.includes(name) && <Medal />}
                                            <span>{name}</span>
                                        </div>}
                                    {/*골	골순위	일평균 득점	어시	어시순위	일평균 어시	공격포인트	순위	출석	출석순위	포인트 총합(출석,어시,골)	포인트 총합순위*/}
                                    {tap === '현황판' &&
                                        <>
                                            <span>{analyzedData.active.totalData.get(name)['골']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['골순위']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['일평균득점']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['어시']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['어시순위']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['일평균어시']}</span>
                                            <CustomMinWidthSpan $propsWidth='17%'>{analyzedData.active.totalData.get(name)['공격포인트']}</CustomMinWidthSpan>
                                            <span>{analyzedData.active.totalData.get(name)['공격포인트순위']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['출석']}</span>
                                            <span>{analyzedData.active.totalData.get(name)['출석순위']}</span>
                                            <CustomMinWidthSpan $propsWidth='26%' $propsMax='10%'>{analyzedData.active.totalData.get(name)['포인트총합']}</CustomMinWidthSpan>
                                            <CustomMinWidthSpan $propsWidth='26%' $propsMax='10%'>{analyzedData.active.totalData.get(name)['포인트총합순위']}</CustomMinWidthSpan>
                                        </>
                                    }
                                    {tap === '출석' && tableData?.data?.map((data, index) => (<span key={name + index}>{data.data[name] ? 'O' : '-'}</span>))}
                                    {tap === '골' && tableData?.data?.map((data, index) => (<span key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '-' : data.data[name][tap] : '-'}</span>))}
                                    {tap === '어시' && tableData?.data?.map((data, index) => (<span key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '-' : data.data[name][tap] : '-'}</span>))}
                                    {tap !== '현황판' && tableData?.data && <span>{quarterData.totalData.get(name)[tap]}</span>}
                                </TableRowStat>
                            <StyledHR $tap={tap} /></>))
                        }
                        {/*장기 미출석 인원*/}
                        {sortedAbsenteeNames?.map((name, index) =>
                            (<><TableRowOther key={index}>
                                {tap === '현황판' ? <FirstColumn><div style={{width: '75px'}}>{name}</div></FirstColumn> : <div style={{minWidth: '20%', flex: '1'}}>{name}</div>}
                                {
                                    tap === '출석' ? tableData?.data?.map((data, index) => (
                                            <span key={name + index}>{data.data[name] ? 'O' : ''}</span>))
                                        : tap === '골' ? tableData?.data?.map((data, index) => (<span
                                                key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '' : data.data[name][tap] : ''}</span>))
                                            : tableData?.data?.map((data, index) => (<span
                                                key={name + index}>{data.data[name] ? Number(data.data[name][tap]) === 0 ? '' : data.data[name][tap] : ''}</span>))
                                }
                                <span className='flex items-center pre text-xs'></span>
                            </TableRowOther>
                            <StyledHR $tap={tap} /></>))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default DataTable

const MonthContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 30px;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    padding-top: 10px;
    padding-bottom: 10px;
    @media (max-width: 812px) {
        font-size: 15px;
    }
`

const LeftButton = styled.div`
    background: url(${left}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 20px;
        height: 20px;
    }
`

const Month = styled.div`
    position: relative;
    top: -1px;
    left: -4px;
`

const RightButton = styled.div`
    background: url(${right}) no-repeat center center;
    background-size: 100% 100%;
    width: 25px;
    height: 25px;
    cursor: pointer;
    @media (max-width: 812px) {
        width: 20px;
        height: 20px;
    }
`

const TableContainer = styled.div`
    overflow-x: auto;
`

const Table = styled.div`
    display: flex;
    flex-direction: column;
`

const TableHeaderStat = styled.div`
    display: flex;
    align-items: center;
    //padding: 8px 16px;
    //width: fit-content;
    padding-bottom: 8px;
    justify-content: space-between;
    > div {
        flex: 1;
        min-width: 7%;
        max-width: 7%;
        height: 36px;
        display: flex;
        white-space: pre-line;
        border-right: 1px solid #ccc;
        justify-content: center;
        align-items: center;
        @media (max-width: 812px) {
            font-size: 12px;
            min-width: 15%;
        }
    }
`

const TableHeaderOther = styled.div`
    display: flex;
    align-items: center;
    //padding: 8px 16px;
    //width: fit-content;
    padding-bottom: 8px;
    //border-bottom: 1px solid #ccc;
    > div {
        flex: 1;
        min-width: 20%;
        font-size: 12px;
        white-space: pre-line;
        border-right: 1px solid #ccc;
    }
    > span {
        flex: 1;
        min-width: 13%;
        font-size: 12px;
        border-right: 1px solid #ccc;
    }
`

const TableBody = styled.div`
    display: flex;
    flex-direction: column;
`

const TableRowStat = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
    > span {
        flex: 1;
        min-width: 7%;
        border-right: 1px solid #ccc;
        //border-top: 1px solid #ccc;
        @media (max-width: 812px) {
            min-width: 15%;
        }
    }
`

const TableRowOther = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
    > span {
        flex: 1;
        min-width: 13%;
    }
`

const FirstColumn = styled.div`
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    @media (prefers-color-scheme: dark) {
        background: black;
    }
`

const CustomMinWidthSpan = styled.span`
    min-width: ${props => props.$propsMax} !important;
    @media (max-width: 812px) {
        min-width: ${props => props.$propsWidth} !important;
    }
`

const CustomMinWidthDiv = styled.div`
    flex: 1;
    min-width: 7%;
    max-width: ${props => props.$propsMax} !important;;
    white-space: pre-line;
    @media (max-width: 812px) {
        font-size: 12px;
        min-width: ${props => props.$propsWidth} !important;
    }
`

const StyledHR = styled.hr`
    @media (max-width: 812px) {
        width: ${props => props.$tap === '현황판' && '215%'} !important;
    }
`

const Medal = styled.div`
    position: absolute;
    width: 25px;
    height: 25px;
    &::after {
        position: absolute;
        content: '';
        background-image: url(${medal});
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        width: 100%;
        height: 100%;
        left: -150%;
        top: 8%;
    }
`

const StatusBoardName = styled.div`
    width: 75px;
    border-right: '1px solid #ccc';
`

const Trophy = styled.div`
    position: absolute;
    width: 30px;
    height: 30px;
    &::after {
        position: absolute;
        content: '';
        background-image: ${props => props.$king === 'goal' ? `url(${goal})` : props.$king === 'assist' ? `url(${assist})` : `url(${attendance})`};
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        width: 100%;
        height: 100%;
        left: 0;
        top: -40%;
    }
`