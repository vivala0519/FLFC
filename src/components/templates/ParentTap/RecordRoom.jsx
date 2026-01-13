import './LetsRecord.css'
import { useEffect, useState } from 'react'

import getTimes from '@/hooks/getTimes.js'
import getRecords from '@/hooks/getRecords.js'
import { extractQuarterData } from '../../../apis/calculateQuarterData.js'

import DataTable from '../../DataTable.jsx'
import HistoryTap from '../ChildTap/HistoryTap.jsx'
import AnalysisTap from '../ChildTap/AnalysisTap.jsx'

const RecordRoom = (props) => {
  const { test, setSelectedYear, recordRoomLoadingFlag } = props
  const {
    time: { thisYear },
  } = getTimes()
  const { firestoreRecord } = getRecords()
  const [fetchData, setFetchData] = useState([])
  const [analyzedData, setAnalyzedData] = useState({})
  const tapName = ['승점', '출석', '골', '어시', '분석', '히스토리']
  const [tap, setTap] = useState('승점')
  const [year, setYear] = useState(thisYear)
  const [yearData, setYearData] = useState({})
  const [analyedYearData, setAnalyzedYearData] = useState({})
  const [month, setMonth] = useState([])
  const [weeksPerMonth, setWeeksPerMonth] = useState([])
  const [page, setPage] = useState(0)
  const [quarter, setQuarter] = useState()
  const [blockSetPage, setBlockSetPage] = useState(false)
  const [tableData, setTableData] = useState({})
  const [quarterData, setQuarterData] = useState([])

  const getYearData = (year) => {
    if (firestoreRecord && firestoreRecord[year]) {
      const fetchedData = firestoreRecord[year].filter(
        (data) => data.id !== 'last_season_kings',
      )
      const quarterData = extractQuarterData(year, fetchedData)

      const yearsData = { ...yearData }
      yearsData[year] = fetchedData

      const analyzedYearsData = { ...analyedYearData }
      analyzedYearsData[year] = quarterData

      setYearData(yearsData)
      setAnalyzedYearData(analyzedYearsData)
      setFetchData(fetchedData)
      setAnalyzedData(quarterData)
    }
  }

  // 연도 변경
  useEffect(() => {
    setBlockSetPage(false)
    setSelectedYear(year)
    if (!yearData[year]) {
      getYearData(year)
    } else {
      setFetchData(yearData[year])
      setAnalyzedData(analyedYearData[year])
    }
  }, [year, firestoreRecord])

  useEffect(() => {
    // 월별 주차 계산
    const monthSet = new Set()
    const weeksByMonth = fetchData?.reduce((acc, cur) => {
      const key = Number(cur.id.slice(0, 2))
      monthSet.add(key)
      acc[key] ? acc[key]++ : (acc[key] = 1)
      return acc
    }, {})
    // 진행된 월 set
    setMonth([...monthSet])
    // 초기 월 설정
    if (!blockSetPage) {
      if (year === '2021') {
        setPage(2)
      } else {
        setPage([...monthSet][monthSet.size - 1] - 1)
      }
    }
    setWeeksPerMonth(weeksByMonth)
  }, [fetchData, year])

  useEffect(() => {
    if (firestoreRecord) {
      const tableData = firestoreRecord[year]?.filter(
        (data) => Number(data.id.slice(0, 2)) === month[page],
      )
      const obj = {
        month: month[page],
        weeks: weeksPerMonth[month[page]],
        data: tableData,
      }
      setTableData(obj)
    }
  }, [page, month, weeksPerMonth, firestoreRecord])

  useEffect(() => {
    const selectedMonth = month[page]
    let quarterData = []
    if (analyzedData?.totalQuarterData) {
      if (year === '2021') {
        quarterData = analyzedData.totalQuarterData[0]
      } else {
        if (selectedMonth <= 3) {
          quarterData = analyzedData.totalQuarterData[0]
        } else if (selectedMonth > 3 && selectedMonth <= 6) {
          quarterData = analyzedData.totalQuarterData[1]
        } else if (selectedMonth > 6 && selectedMonth <= 9) {
          quarterData = analyzedData.totalQuarterData[2]
        } else {
          quarterData = analyzedData.totalQuarterData[3]
        }
      }
    }
    setQuarterData(quarterData)
  }, [tableData, analyzedData])

  const setTapHandler = (tapNumber) => {
    if (tapNumber === 0 && year <= 2025) {
      setYear(thisYear)
    }
    setTap(tapName[tapNumber])
  }

  return (
    <div className="w-full relative h-full" style={{ top: '-10px' }}>
      {recordRoomLoadingFlag && (
        <div className="fixed left-[0rem] z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      <div
        className="flex flex-row w-full mb-2 p-1"
        style={{ fontFamily: 'DNFForgedBlade' }}
      >
        <div
          className="flex flex-row w-full justify-center"
          style={{ gap: '8%' }}
        >
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '승점' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(0)}
          >
            승점
          </div>
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '출석' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(1)}
          >
            출석
          </div>
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '골' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(2)}
          >
            골
          </div>
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '어시' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(3)}
          >
            어시
          </div>
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '분석' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(4)}
          >
            분석
          </div>
          <div
            className={`underline decoration-2 decoration-solid decoration-blue-700 cursor-pointer ${tap === '히스토리' && 'text-goal'}`}
            style={{ width: 'fit-content' }}
            onClick={() => setTapHandler(5)}
          >
            히스토리
          </div>
        </div>
      </div>
      <div>
        {['승점', '출석', '골', '어시'].includes(tap) ? (
          <DataTable
            tap={tap}
            tableData={tableData}
            page={page}
            setPage={setPage}
            year={year}
            setYear={setYear}
            month={month}
            quarterData={quarterData}
            quarter={quarter}
            setQuarter={setQuarter}
            setBlockSetPage={setBlockSetPage}
          />
        ) : tap === '히스토리' ? (
          <HistoryTap />
        ) : (
          <AnalysisTap test={test} />
        )}
      </div>
    </div>
  )
}

export default RecordRoom