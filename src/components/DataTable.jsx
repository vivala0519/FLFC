import { useEffect, useState } from 'react'
import styled from 'styled-components'

import './DataTable.css'
import up from '@/assets/up2.png'
import down from '@/assets/down2.png'
import left from '@/assets/left.png'
import right from '@/assets/right.png'
import medal from '@/assets/medal.png'

import getTimes from '@/hooks/getTimes.js'

const formatQuarterPointsPerGame = (stats) =>
  stats['경기'] > 0
    ? `${Number((stats['승점'] / stats['경기']).toFixed(2))}`
    : '-'

const getKingTitles = (kings, name) => {
  const awards = [
    ['goal_king', '득점왕'],
    ['assist_king', '어시왕'],
    ['point_king', '승점왕'],
    ['attendance_king', '출석왕'],
  ]

  return awards
    .filter(([key]) => {
      const winners = kings?.[key]
      return Array.isArray(winners) ? winners.includes(name) : winners === name
    })
    .map(([, title]) => title)
}

const KingLabels = ({ titles }) => titles.length > 0 && (
  <div className="absolute -left-6 top-0 flex w-[75px] flex-wrap items-center justify-center gap-x-1 text-[8px] leading-3 text-[#bb2649] dark:text-red-300 font-dnf-bit animate-pulse">
    {titles.map((title) => (
      <span key={title} className="inline-block whitespace-nowrap -rotate-[12deg]">{title}</span>
    ))}
  </div>
)

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
  const [arrowState, setArrowState] = useState('이름')
  const [sortDirection, setSortDirection] = useState('asc')
  const selectedStatusColumnIndex = STATUS_BOARD_SORT_KEYS.indexOf(arrowState) + 1
  const startYear = tap === '승점' ? 2026 : 2021

  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches)

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
        [...analyzedData.active.members.active].sort((a, b) => {
          if (arrowState === '이름') {
            return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
          }
          const aValue = Number(analyzedData.active.totalData.get(a)?.[arrowState]) || 0
          const bValue = Number(analyzedData.active.totalData.get(b)?.[arrowState]) || 0
          const difference = sortDirection === 'asc' ? aValue - bValue : bValue - aValue
          return difference || a.localeCompare(b)
        }),
      )
      setSortedAbsenteeNames(
        [...analyzedData.active.members.inactive].sort((a, b) =>
          a.localeCompare(b),
        ),
      )
    } else {
      // if (analyzedData['members']) {
        // console.log(quarter)
        // console.log(analyzedData['members']['inactive'])
        // console.log(analyzedData['totalQuarterData'][Number(quarter) - 1])
        // setSortedAbsenteeNames(analyzedData['members']['inactive'].sort((a, b) => a.localeCompare(b)))
      // }
    }
    // console.log(analyzedData)

    // setSortedAbsenteeNames(analyzedData?.active?.members['inactive'].sort((a, b) => a.localeCompare(b)))
  }, [analyzedData, tap, arrowState, sortDirection])

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
    } else if (tap === '승점') {
      setWinnerList(maxValuePeople)
    } else {
      setWinnerList([])
    }
  }

  // 탭에 따른 정렬
  useEffect(() => {
    if (quarterData?.members) {
      if (tap === '승점') {
        // eslint-disable-next-line no-unsafe-optional-chaining
        const sortedByPoints = [...quarterData.members['active']].sort((a, b) => {
          const aPoints = quarterData.totalData.get(a)['승점']
          const bPoints = quarterData.totalData.get(b)['승점']
          return bPoints - aPoints
        })
        setSortedNames(sortedByPoints)
        extractWinners(sortedByPoints)
      } else if (tap === '골') {
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
    setSortDirection((current) =>
      by === arrowState
        ? current === 'asc' ? 'desc' : 'asc'
        : by === '이름' ? 'asc' : 'desc',
    )
    setArrowState(by)
  }

  const renderSortArrow = (column) => {
    const Arrow = column === arrowState && sortDirection === 'asc'
      ? UpArrow
      : DownArrow
    return <Arrow className={arrowState === column ? 'arrow' : 'opacity-50'} aria-hidden="true" />
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
        <Table $tap={tap}>
          {tap === '현황판' ? (
            <div>
              <p
                className="w-full text-blueSignature dark:text-blue-300"
                style={{
                  fontSize: '12px',
                  textAlign: 'left',
                  marginBottom: '6px',
                  paddingLeft: '6px',
                }}
              >
                실참여 인원 :{' '}
                <span
                  style={{ fontSize: '13px' }}
                  className={
                    analyzedData?.lastFourWeeksAttendance &&
                    analyzedData.lastFourWeeksAttendance.size < 25
                      ? 'text-goal dark:text-yellow-400'
                      : 'text-blue-600'
                  }
                >
                  {analyzedData?.lastFourWeeksAttendance &&
                    analyzedData.lastFourWeeksAttendance.size}
                </span>
              </p>
              <TableHeaderStat $sortedIndex={selectedStatusColumnIndex}>
                <StatTd
                  id="first_element"
                  style={{ paddingLeft: '12px', minWidth: '72px', maxWidth: '75px' }}
                  onClick={() => sortBy('이름')}
                >
                  <span>이름</span>
                  {renderSortArrow('이름')}
                </StatTd>
                <StatTd onClick={() => sortBy('승점')}>
                  <span>승점</span>
                  {renderSortArrow('승점')}
                </StatTd>
                <StatTd onClick={() => sortBy('경기')}>
                  <span>경기수</span>
                  {renderSortArrow('경기')}
                </StatTd>
                <StatTd onClick={() => sortBy('승점률')}>
                  <span>{`경기당\n승점`}</span>
                  {renderSortArrow('승점률')}
                </StatTd>
                <StatTd onClick={() => sortBy('골')}>
                  <span>골</span>
                  {renderSortArrow('골')}
                </StatTd>
                <StatTd onClick={() => sortBy('일평균득점')}>
                  <span>{`일평균\n득점`}</span>
                  {renderSortArrow('일평균득점')}
                </StatTd>
                <StatTd onClick={() => sortBy('어시')}>
                  <span>어시</span>
                  {renderSortArrow('어시')}
                </StatTd>
                <StatTd onClick={() => sortBy('일평균어시')}>
                  <span>{`일평균\n어시`}</span>
                  {renderSortArrow('일평균어시')}
                </StatTd>
                <StatTd onClick={() => sortBy('공격포인트')}>
                  <span>{'공격\n포인트'}</span>
                  {renderSortArrow('공격포인트')}
                </StatTd>
                <StatTd onClick={() => sortBy('일평균공격포인트')}>
                  <span>{'일평균\n공격포인트'}</span>
                  {renderSortArrow('일평균공격포인트')}
                </StatTd>
                <StatTd onClick={() => sortBy('출석')}>
                  <span>출석</span>
                  {renderSortArrow('출석')}
                </StatTd>
                {/*<CustomMinWidthDiv*/}
                {/*  onClick={() => sortBy('포인트총합')}*/}
                {/*  $propsWidth="15%"*/}
                {/*  $propsMax="9.5%"*/}
                {/*  $propsSize="8px"*/}
                {/*>*/}
                {/*  <span>{`출석/어시/골\n포인트 총합`}</span>*/}
                {/*  {renderSortArrow('포인트총합')}*/}
                {/*</CustomMinWidthDiv>*/}
              </TableHeaderStat>
            </div>
          ) : (
            <TableHeaderOther>
              <div style={{ width: '75px' }}>이름</div>
              {tableData?.data?.map((data) => (
                <span key={data.id}>{Number(data.id.slice(2, 4)) + '일'}</span>
              ))}
              {year !== '2021' ? (
                <span style={tap === '승점' ? { minWidth: '82px' } : undefined}>
                <p
                  style={{ fontSize: '11px' }}
                >{`${quarterName}분기`}</p>
                  <p
                    style={{ fontSize: '11px' }}
                  >총합</p>
                </span>
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
                <TableRowStat
                  key={index}
                  $tap={tap}
                  $sortedIndex={tap === '현황판' ? selectedStatusColumnIndex : 0}
                >
                  {tap === '현황판' ? (
                    <FirstColumn $realActive={analyzedData.lastFourWeeksAttendance.has(name)} $isDark={isDark}>
                      <KingLabels titles={getKingTitles(lastSeasonKings, name)} />
                      <StatusBoardName>
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
                  {/* 경기  승점 골	골순위	일평균 득점	어시	어시순위	일평균 어시	공격포인트	순위	출석	출석순위	포인트 총합(출석,어시,골)	포인트 총합순위*/}
                  {tap === '현황판' && (
                      <>
                        <span>
                        {analyzedData?.active?.totalData?.get(name)?.['승점'] ?? '-'}
                      </span>
                        <span>
                        {analyzedData?.active?.totalData?.get(name)?.['경기'] ?? '-'}
                      </span>
                        <span>
                        {analyzedData?.active?.totalData?.get(name)?.['승점률'] ?? '-'}
                      </span>
                        <span>
                        {analyzedData.active.totalData.get(name)['골']}
                      </span>
                        <span>
                        {analyzedData.active.totalData.get(name)['일평균득점']}
                      </span>
                        <span>
                        {analyzedData.active.totalData.get(name)['어시']}
                      </span>
                        <span>
                        {analyzedData.active.totalData.get(name)['일평균어시']}
                      </span>
                        <CustomMinWidthSpan $propsWidth="14%">
                          {analyzedData.active.totalData.get(name)['공격포인트']}
                        </CustomMinWidthSpan>
                        <span>
                          {analyzedData.active.totalData.get(name)['일평균공격포인트']}
                        </span>
                        <span>
                        {analyzedData.active.totalData.get(name)['출석']}
                      </span>
                        {/*<CustomMinWidthSpan $propsWidth="14%" $propsMax="10%">*/}
                        {/*  {analyzedData.active.totalData.get(name)['포인트총합']}*/}
                        {/*</CustomMinWidthSpan>*/}
                      </>
                  )}
                  {tap === '경기' &&
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
                  {tap === '승점' &&
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
                    tap === '승점' ? (
                      <QuarterPointsCell>
                        <span>{quarterData.totalData.get(name)['승점']}</span>
                        <small>
                          경기당 {formatQuarterPointsPerGame(quarterData.totalData.get(name))}
                        </small>
                      </QuarterPointsCell>
                    ) : (
                      <span>{quarterData.totalData.get(name)[tap]}</span>
                    )
                  )}
                </TableRowStat>
                <StyledHR $tap={tap} />
              </div>
            ))}
            {/*장기 미출석 인원*/}
            {sortedAbsenteeNames?.map((name, index) => (
              <div key={'sorted-ab-' + index}>
                <TableRowOther
                  key={index}
                  $tap={tap}
                  $sortedIndex={tap === '현황판' ? selectedStatusColumnIndex : 0}
                >
                  {tap === '현황판' ? (
                    <FirstColumn
                      $realActive={analyzedData.lastFourWeeksAttendance.has(
                        name,
                      )}
                    >
                      <KingLabels titles={getKingTitles(lastSeasonKings, name)} />
                      <StatusBoardName>{name}</StatusBoardName>
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
                  {tap === '현황판' ? (
                    Array.from({ length: STATUS_BOARD_SORT_KEYS.length - 1 }, (_, cellIndex) => (
                      <span key={cellIndex} aria-hidden="true" />
                    ))
                  ) : (
                    <span className="flex items-center pre text-xs"></span>
                  )}
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

const STATUS_BOARD_COLUMNS = '75px repeat(7, minmax(60px, 1fr)) minmax(70px, 1.1fr) minmax(80px, 1.2fr) minmax(60px, 1fr)'
const STATUS_BOARD_MIN_WIDTH = 75 + 7 * 60 + 70 + 80 + 60
const STATUS_BOARD_SORT_KEYS = ['이름', '승점', '경기', '승점률', '골', '일평균득점', '어시', '일평균어시', '공격포인트', '일평균공격포인트', '출석']
const selectedColumnStyle = (index) => index > 0 && `
  > :nth-child(${index}) {
    background-color: #eff6ff;
    color: #111827;
  }

  @media (prefers-color-scheme: dark) {
    > :nth-child(${index}) {
      background-color: #374151;
      color: #f9fafb;
    }
  }
`

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
  min-width: ${(props) => props.$tap === '현황판' ? `${STATUS_BOARD_MIN_WIDTH}px` : '0'};
`

const TableHeaderStat = styled.div`
  display: grid;
  grid-template-columns: ${STATUS_BOARD_COLUMNS};
  align-items: stretch;
  padding-bottom: 2px;

  > div {
    min-width: 0;
    min-height: 36px;
    display: flex;
    gap: 2px;
    padding: 0 2px;
    white-space: pre-line;
    border-right: 1px solid #ccc;
    justify-content: center;
    align-items: center;
    > span {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    @media (max-width: 812px) {
      font-size: 12px;
    }
  }

  ${(props) => selectedColumnStyle(props.$sortedIndex)}
`

const StatTd = styled.div`
  display: flex;
  flex-direction: row;
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
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  background-image: url(${up});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  @media (max-width: 812px) {
    flex-basis: 10px;
    width: 10px;
    height: 10px;
  }
`

const DownArrow = styled.div`
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  background-image: url(${down});
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  @media (max-width: 812px) {
    flex-basis: 10px;
    width: 10px;
    height: 10px;
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
  display: ${(props) => props.$tap === '현황판' ? 'grid' : 'flex'};
  grid-template-columns: ${STATUS_BOARD_COLUMNS};
  align-items: center;
  min-height: 35px;

  > span {
    flex: 1;
    min-width: 7%;
    border-right: 1px solid #ccc;
    //border-top: 1px solid #ccc;
    @media (max-width: 812px) {
      min-width: 13%;
    }
  }

  ${(props) => props.$tap === '현황판' && `
    > span {
      min-width: 0 !important;
      display: flex;
      align-self: stretch;
      align-items: center;
      justify-content: center;
    }
  `}

  ${(props) => selectedColumnStyle(props.$sortedIndex)}
`

const QuarterPointsCell = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 82px !important;
  line-height: 1.2;
  white-space: nowrap;

  > small {
    font-size: 10px;
    opacity: 0.75;
  }
`

const TableRowOther = styled.div`
  display: ${(props) => props.$tap === '현황판' ? 'grid' : 'flex'};
  grid-template-columns: ${STATUS_BOARD_COLUMNS};
  align-items: center;
  min-height: 35px;

  > span {
    flex: 1;
    min-width: 13%;
  }

  ${(props) => props.$tap === '현황판' && `
    > span {
      min-width: 0;
      align-self: stretch;
      border-right: 1px solid #ccc;
    }
  `}

  ${(props) => selectedColumnStyle(props.$sortedIndex)}
`

const FirstColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 75px;
  min-height: 35px;
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: #fff;

  @media (prefers-color-scheme: dark) {
    background-color: #242424;
  }

  &::after {
    content: '';
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    position: absolute;
    border-right: ${(props) =>
      props.$realActive ? props.$isDark ? '5px double #93c5fd' : '5px double #1d4ed8' : '1px solid #ccc'};
  }
`

const StyledHR = styled.hr`
  @media (max-width: 812px) {
    width: ${(props) => props.$tap === '현황판' && '100%'} !important;
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
  text-align: center;
`
