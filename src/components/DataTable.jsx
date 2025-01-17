import { useEffect, useState } from 'react'
import styled from 'styled-components'

import './DataTable.css'
import up from '@/assets/up.png'
import down from '@/assets/down.png'
import left from '@/assets/left.png'
import goal from '@/assets/goal2.png'
import right from '@/assets/right.png'
import medal from '@/assets/medal.png'
import assist from '@/assets/assist2.png'
import attendance from '@/assets/attendance2.png'

import getTimes from '@/hooks/getTimes.js'

const DataTable = (props) => {
  const {
    time: { thisYear },
  } = getTimes()
  const {
    tap,
    tableData,
    analyzedData,
    page,
    setPage,
    year,
    setYear,
    month,
    quarterData,
    lastSeasonKings,
    quarter,
    setQuarter,
    setBlockSetPage,
  } = props

  const [sortedNames, setSortedNames] = useState([])
  const [sortedAbsenteeNames, setSortedAbsenteeNames] = useState([])
  const [quarterName, setQuarterName] = useState('')
  const [winnerList, setWinnerList] = useState([])
  const [kingList, setKingList] = useState([])
  const [arrowState, setArrowState] = useState('이름')
  const [arrowDirection, setArrowDirection] = useState(true)
  const startYear = 2021

  useEffect(() => {
    if (tableData?.data?.length > 0) {
      // console.log('tableData.data', tableData.data)
    }
    // console.log('analyzedData', analyzedData)
    // console.log('quarterData', quarterData)
  }, [tableData])

  // useEffect(() => {
  //     console.log(sortedNames)
  // }, [sortedNames])
  //
  useEffect(() => {
    // console.log(analyzedData.lastFourWeeksAttendance)
  }, [analyzedData])
  //
  // useEffect(() => {
  //     console.log(analyzedData)
  // }, [analyzedData])

  useEffect(() => {
    if (analyzedData?.active?.members && tap === '현황판') {
      setSortedNames(
        analyzedData?.active?.members['active'].sort((a, b) =>
          a.localeCompare(b),
        ),
      )
      setSortedAbsenteeNames(
        analyzedData?.active?.members['inactive'].sort((a, b) =>
          a.localeCompare(b),
        ),
      )
    } else {
      if (analyzedData['members']) {
        // console.log(quarter)
        // console.log(analyzedData['members']['inactive'])
        // console.log(analyzedData['totalQuarterData'][Number(quarter) - 1])
        // setSortedAbsenteeNames(analyzedData['members']['inactive'].sort((a, b) => a.localeCompare(b)))
      }
    }
    // console.log(analyzedData)

    // setSortedAbsenteeNames(analyzedData?.active?.members['inactive'].sort((a, b) => a.localeCompare(b)))
  }, [analyzedData])

  const extractWinners = (sortedByValue) => {
    const maxValue = Math.max(
      ...sortedByValue.map((name) => quarterData.totalData.get(name)[tap]),
    )
    let maxValuePeople = sortedByValue.filter(
      (name) => quarterData.totalData.get(name)[tap] === maxValue,
    )
    if (['골', '어시'].includes(tap)) {
      const totalScore = maxValuePeople.map(
        (name) =>
          quarterData.totalData.get(name)['골'] +
          quarterData.totalData.get(name)['어시'] +
          quarterData.totalData.get(name)['출석'],
      )
      const maxValueOfTotalScore = Math.max(...totalScore)
      const winner = maxValuePeople.filter(
        (name) =>
          totalScore[maxValuePeople.indexOf(name)] === maxValueOfTotalScore,
      )
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
          const aGoals = quarterData.totalData.get(a)['골']
          const bGoals = quarterData.totalData.get(b)['골']
          return bGoals - aGoals
        })
        setSortedNames(sortedByGoal)
        extractWinners(sortedByGoal)
      } else if (tap === '어시') {
        // eslint-disable-next-line no-unsafe-optional-chaining
        const sortedByAssist = [...quarterData.members['active']].sort(
          (a, b) => {
            const aAssists = quarterData.totalData.get(a)['어시']
            const bAssists = quarterData.totalData.get(b)['어시']
            return bAssists - aAssists
          },
        )
        setSortedNames(sortedByAssist)
        extractWinners(sortedByAssist)
      } else if (tap === '출석') {
        // eslint-disable-next-line no-unsafe-optional-chaining
        const sortedByAttendance = [...quarterData.members['active']].sort(
          (a, b) => {
            const aAttendance = quarterData.totalData.get(a)['출석']
            const bAttendance = quarterData.totalData.get(b)['출석']
            return bAttendance - aAttendance
          },
        )
        setSortedNames(sortedByAttendance)
        extractWinners(sortedByAttendance)
      } else {
        setSortedNames(
          analyzedData?.active?.members['active'].sort((a, b) =>
            a.localeCompare(b),
          ),
        )
      }
    }
  }, [analyzedData, tap, quarterData])

  const findTrophy = (name) => {
    if (lastSeasonKings?.goal_king === name) {
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
    if (tap !== '현황판') {
      const selectedMonth = month[page]
      if (selectedMonth) {
        if (selectedMonth < 4) {
          setQuarterName('1')
          setQuarter(1)
        } else if (selectedMonth < 7) {
          setQuarterName('2')
          setQuarter(2)
        } else if (selectedMonth < 10) {
          setQuarterName('3')
          setQuarter(3)
        } else {
          setQuarterName('4')
          setQuarter(4)
        }
      }
    }
  }, [month, page])

  const pageMoveHandler = (left) => {
    setBlockSetPage(true)
    if (left && page > 0) {
      setPage(page - 1)
      return
    }
    if (!left && page < month.length - 1) {
      setPage(page + 1)
    }
  }

  // th에 따른 정렬
  const sortBy = (by) => {
    if (by === '이름') {
      if (!arrowDirection) {
        setSortedNames(
          analyzedData?.active?.members['active'].sort((a, b) =>
            a.localeCompare(b),
          ),
        )
      } else {
        setSortedNames(
          analyzedData?.active?.members['active']
            .sort((a, b) => a.localeCompare(b))
            .reverse(),
        )
      }
      setArrowDirection(!arrowDirection)
    } else {
      setSortedNames(
        [...sortedNames].sort((a, b) => {
          const aEl = analyzedData.active.totalData.get(a)[by]
          const bEl = analyzedData.active.totalData.get(b)[by]
          return bEl - aEl
        }),
      )
      setArrowDirection(false)
    }
    setArrowState(by)
  }

  return (
    <div>
      {tap !== '현황판' && (
        <div className="flex flex-row gap-14 items-center justify-start border-t-2 border-t-gray-200 pl-4 mb-2 border-b-2 border-b-gray-200">
          <YearContainer value={year} onChange={(e) => setYear(e.target.value)}>
            {Array.from({ length: thisYear - startYear + 1 }, (_, i) => (
              <option key={i} value={startYear + i}>
                {startYear + i}년
              </option>
            ))}
          </YearContainer>
          <MonthContainer className="">
            <PageButton
              onClick={() => pageMoveHandler(true)}
              $direction="left"
              $show={page !== 0}
            />
            <Month className="">{tableData.month}월</Month>
            <PageButton
              onClick={() => pageMoveHandler(false)}
              $direction="right"
              $show={page !== month.length - 1}
            />
          </MonthContainer>
        </div>
      )}
      <TableContainer>
        <Table>
          {tap === '현황판' ? (
            <div>
              <p
                className="w-full text-green-800"
                style={{
                  fontSize: '12px',
                  textAlign: 'left',
                  marginBottom: '2px',
                }}
              >
                실참여 인원 :{' '}
                <span
                  style={{ fontSize: '13px' }}
                  className={
                    analyzedData?.lastFourWeeksAttendance &&
                    analyzedData.lastFourWeeksAttendance.size < 25
                      ? 'text-rose-700'
                      : 'text-green-600'
                  }
                >
                  {analyzedData?.lastFourWeeksAttendance &&
                    analyzedData.lastFourWeeksAttendance.size}
                </span>
              </p>
              <TableHeaderStat>
                <StatTd
                  id="first_element"
                  style={{ minWidth: '72px', maxWidth: '75px' }}
                  onClick={() => sortBy('이름')}
                >
                  <span>이름</span>
                  {arrowState === '이름' &&
                    (arrowDirection ? (
                      <DownArrow className="arrow" />
                    ) : (
                      <UpArrow className="arrow" />
                    ))}
                </StatTd>
                <StatTd onClick={() => sortBy('골')}>
                  <span>골</span>
                  {arrowState === '골' && <DownArrow className="arrow" />}
                </StatTd>
                <StatTd onClick={() => sortBy('골')}>
                  <span>골순위</span>
                  {arrowState === '골' && <DownArrow className="arrow" />}
                </StatTd>
                <StatTd onClick={() => sortBy('일평균득점')}>
                  <span>{`일평균\n득점`}</span>
                  {arrowState === '일평균득점' && (
                    <DownArrow className="arrow" />
                  )}
                </StatTd>
                <StatTd onClick={() => sortBy('어시')}>
                  <span>어시</span>
                  {arrowState === '어시' && <DownArrow className="arrow" />}
                </StatTd>
                <StatTd onClick={() => sortBy('어시')}>
                  <span>어시순위</span>
                  {arrowState === '어시' && <DownArrow className="arrow" />}
                </StatTd>
                <StatTd onClick={() => sortBy('일평균어시')}>
                  <span>{`일평균\n어시`}</span>
                  {arrowState === '일평균어시' && (
                    <DownArrow className="arrow" />
                  )}
                </StatTd>
                <StatTd onClick={() => sortBy('공격포인트')}>
                  <span>{'공격\n포인트'}</span>
                  {arrowState === '공격포인트' && (
                    <DownArrow className="arrow" />
                  )}
                </StatTd>
                <StatTd onClick={() => sortBy('공격포인트')}>
                  <span>공포순위</span>
                  {arrowState === '공격포인트' && (
                    <DownArrow className="arrow" />
                  )}
                </StatTd>
                <StatTd onClick={() => sortBy('출석')}>
                  <span>출석</span>
                  {arrowState === '출석' && <DownArrow className="arrow" />}
                </StatTd>
                <StatTd onClick={() => sortBy('출석')}>
                  <span>출석순위</span>
                  {arrowState === '출석' && <DownArrow className="arrow" />}
                </StatTd>
                <CustomMinWidthDiv
                  onClick={() => sortBy('포인트총합')}
                  $propsWidth="15%"
                  $propsMax="9.5%"
                  $propsSize="8px"
                >
                  <span>{`출석/어시/골\n포인트 총합`}</span>
                  {arrowState === '포인트총합' && (
                    <DownArrow className="arrow" />
                  )}
                </CustomMinWidthDiv>
                <CustomMinWidthDiv
                  id="last_element"
                  onClick={() => sortBy('포인트총합')}
                  $propsWidth="15%"
                  $propsMax="9.5%"
                  $propsSize="9px"
                >
                  <span>{'포인트 총합\n순위'}</span>
                  {arrowState === '포인트총합' && (
                    <DownArrow className="arrow" />
                  )}
                </CustomMinWidthDiv>
              </TableHeaderStat>
            </div>
          ) : (
            <TableHeaderOther>
              <div style={{ width: '75px' }}>이름</div>
              {tableData?.data?.map((data) => (
                <span key={data.id}>{Number(data.id.slice(2, 4)) + '일'}</span>
              ))}
              {year !== '2021' ? (
                <span
                  style={{ fontSize: '9px' }}
                >{`${quarterName}분기\n총합`}</span>
              ) : (
                <span
                  style={{ fontSize: '9px', whiteSpace: 'pre-line' }}
                >{`2021\n코로나 시대`}</span>
              )}
            </TableHeaderOther>
          )}
          <StyledHR $tap={tap} />
          <TableBody>
            {/*실 출석 인원 먼저*/}
            {sortedNames?.map((name, index) => (
              <div key={'sorted-' + index}>
                <TableRowStat key={index} $tap={tap}>
                  {tap === '현황판' ? (
                    <FirstColumn
                      $realActive={analyzedData.lastFourWeeksAttendance.has(
                        name,
                      )}
                    >
                      {kingList.includes(name) && (
                        <Trophy className="trophy" $king={findTrophy(name)} />
                      )}
                      <StatusBoardName
                        style={{ width: '72px', borderRight: '1px solid #ccc' }}
                      >
                        {name}
                      </StatusBoardName>
                    </FirstColumn>
                  ) : (
                    <div
                      className="flex items-center justify-center"
                      style={{
                        minWidth: '20%',
                        flex: '1',
                        borderRight: '1px solid #ccc',
                      }}
                    >
                      {winnerList.includes(name) && <Medal />}
                      <span>{name}</span>
                    </div>
                  )}
                  {/*골	골순위	일평균 득점	어시	어시순위	일평균 어시	공격포인트	순위	출석	출석순위	포인트 총합(출석,어시,골)	포인트 총합순위*/}
                  {tap === '현황판' && (
                    <>
                      <span>
                        {analyzedData.active.totalData.get(name)['골']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['골순위']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['일평균득점']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['어시']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['어시순위']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['일평균어시']}
                      </span>
                      <CustomMinWidthSpan $propsWidth="14%">
                        {analyzedData.active.totalData.get(name)['공격포인트']}
                      </CustomMinWidthSpan>
                      <span>
                        {
                          analyzedData.active.totalData.get(name)[
                            '공격포인트순위'
                          ]
                        }
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['출석']}
                      </span>
                      <span>
                        {analyzedData.active.totalData.get(name)['출석순위']}
                      </span>
                      <CustomMinWidthSpan $propsWidth="14%" $propsMax="10%">
                        {analyzedData.active.totalData.get(name)['포인트총합']}
                      </CustomMinWidthSpan>
                      <CustomMinWidthSpan $propsWidth="14%" $propsMax="10%">
                        {
                          analyzedData.active.totalData.get(name)[
                            '포인트총합순위'
                          ]
                        }
                      </CustomMinWidthSpan>
                    </>
                  )}
                  {tap === '출석' &&
                    tableData?.data?.map((data, index) => (
                      <span
                        style={{ minWidth: '13% !important' }}
                        key={name + index}
                      >
                        {data.data[name]
                          ? typeof data.data[name][tap] === 'number'
                            ? data.data[name][tap]
                            : 1
                          : '-'}
                      </span>
                    ))}
                  {tap === '골' &&
                    tableData?.data?.map((data, index) => (
                      <span
                        style={{ minWidth: '13% !important' }}
                        key={name + index}
                      >
                        {data.data[name]
                          ? Number(data.data[name][tap]) === 0
                            ? '-'
                            : data.data[name][tap]
                          : '-'}
                      </span>
                    ))}
                  {tap === '어시' &&
                    tableData?.data?.map((data, index) => (
                      <span
                        style={{ minWidth: '13% !important' }}
                        key={name + index}
                      >
                        {data.data[name]
                          ? Number(data.data[name][tap]) === 0
                            ? '-'
                            : data.data[name][tap]
                          : '-'}
                      </span>
                    ))}
                  {tap !== '현황판' && quarterData?.totalData.get(name) && (
                    <span>{quarterData.totalData.get(name)[tap]}</span>
                  )}
                </TableRowStat>
                <StyledHR $tap={tap} />
              </div>
            ))}
            {/*장기 미출석 인원*/}
            {sortedAbsenteeNames?.map((name, index) => (
              <div key={'sorted-ab-' + index}>
                <TableRowOther key={index}>
                  {tap === '현황판' ? (
                    <FirstColumn
                      $realActive={analyzedData.lastFourWeeksAttendance.has(
                        name,
                      )}
                    >
                      {kingList.includes(name) && (
                        <Trophy className="trophy" $king={findTrophy(name)} />
                      )}
                      <div style={{ width: '75px' }}>{name}</div>
                    </FirstColumn>
                  ) : (
                    <div style={{ minWidth: '20%', flex: '1' }}>{name}</div>
                  )}
                  {tap === '출석'
                    ? tableData?.data?.map((data, index) => (
                        <span key={name + index}>
                          {data.data[name] ? 'O' : ''}
                        </span>
                      ))
                    : tap === '골'
                      ? tableData?.data?.map((data, index) => (
                          <span key={name + index}>
                            {data.data[name]
                              ? Number(data.data[name][tap]) === 0
                                ? ''
                                : data.data[name][tap]
                              : ''}
                          </span>
                        ))
                      : tableData?.data?.map((data, index) => (
                          <span key={name + index}>
                            {data.data[name]
                              ? Number(data.data[name][tap]) === 0
                                ? ''
                                : data.data[name][tap]
                              : ''}
                          </span>
                        ))}
                  <span className="flex items-center pre text-xs"></span>
                </TableRowOther>
                <StyledHR $tap={tap} />
              </div>
            ))}
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
  gap: 15px;
  font-size: 30px;
  padding-top: 7px;
  padding-bottom: 7px;
  @media (max-width: 812px) {
    font-size: 15px;
  }
`
const YearContainer = styled.select`
  font-size: 13px;
`

const PageButton = styled.div`
  visibility: ${(props) => (props.$show ? 'visible' : 'hidden')};
  background: ${(props) =>
    props.$direction === 'right'
      ? `url(${right}) no-repeat center center`
      : `url(${left}) no-repeat center center`};
  background-size: 100% 100%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  @media (max-width: 812px) {
    width: 20px;
    height: 20px;
  }
  @media (prefers-color-scheme: dark) {
    filter: invert(1);
  }
`

const Month = styled.div`
  position: relative;
  top: -1px;
  left: -4px;
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
      min-width: 14%;
    }
  }
`

const StatTd = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
`

const CustomMinWidthDiv = styled.div`
  flex: 1;
  position: relative;
  min-width: 7%;
  max-width: ${(props) => props.$propsMax} !important;
  white-space: pre-line;
  cursor: pointer;
  @media (max-width: 812px) {
    //font-size: 7px !important;
    font-size: ${(props) => props.$propsSize} !important;
  }
`

const CustomMinWidthSpan = styled.span`
  min-width: ${(props) => props.$propsMax} !important;
  @media (max-width: 812px) {
    min-width: ${(props) => props.$propsWidth} !important;
  }
`

const UpArrow = styled.div`
  position: absolute;
  top: 24px;
  width: 20px;
  height: 20px;
  background-image: url(${up});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
`

const DownArrow = styled.div`
  position: absolute;
  top: 24px;
  width: 20px;
  height: 20px;
  background-image: url(${down});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
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
      min-width: ${(props) => (props.$tap === '현황판' ? '14%' : '13%')};
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

  &::after {
    content: '';
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    position: absolute;
    border-right: ${(props) =>
      props.$realActive ? '5px double #166534' : '1px solid #ccc'};
  }
`

const StyledHR = styled.hr`
  @media (max-width: 812px) {
    width: ${(props) => props.$tap === '현황판' && '189%'} !important;
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
    background-image: ${(props) =>
      props.$king === 'goal'
        ? `url(${goal})`
        : props.$king === 'assist'
          ? `url(${assist})`
          : `url(${attendance})`};
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    width: 100%;
    height: 100%;
    left: 0;
    top: -40%;
  }
`
