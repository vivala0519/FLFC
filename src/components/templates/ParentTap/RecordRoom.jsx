import './LetsRecord.css'
import { useEffect, useMemo, useRef, useState } from 'react'

import getTimes from '@/hooks/getTimes.js'
import getRecords from '@/hooks/getRecords.js'
import getMembers from '@/hooks/getMembers.js'
import { extractQuarterData } from '../../../apis/calculateQuarterData.js'

import DataTable from '../../DataTable.jsx'
import HistoryTap from '../ChildTap/HistoryTap.jsx'
import AnalysisTap from '../ChildTap/AnalysisTap.jsx'

const RecordRoom = (props) => {
  const { test, setSelectedYear, recordRoomLoadingFlag } = props
  const { time: { thisYear } } = getTimes()
  const { firestoreRecord } = getRecords()
  const { totalMembers } = getMembers()
  const tapName = ['분석', '승점', '출석', '골', '어시', '히스토리']
  const [tap, setTap] = useState('분석')
  const [year, setYear] = useState(thisYear)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [quarter, setQuarter] = useState()
  const previousCurrentYear = useRef(thisYear)
  const yearRecords = firestoreRecord?.[year]

  const fetchData = useMemo(() =>
    (yearRecords || []).filter((record) => /^\d{4}$/.test(record.id)),
  [yearRecords])
  const analyzedData = useMemo(() =>
    extractQuarterData(year, fetchData, totalMembers),
  [year, fetchData, totalMembers])
  const weeksPerMonth = useMemo(() => fetchData.reduce((counts, record) => {
    const recordMonth = Number(record.id.slice(0, 2))
    counts[recordMonth] = (counts[recordMonth] || 0) + 1
    return counts
  }, {}), [fetchData])
  const month = useMemo(() => Object.keys(weeksPerMonth).map(Number).sort((a, b) => a - b), [weeksPerMonth])
  const defaultPage = year === '2021'
    ? Math.min(2, Math.max(0, month.length - 1))
    : Math.max(0, month.length - 1)
  const selectedPage = selectedMonth?.year === year ? month.indexOf(selectedMonth.month) : -1
  const page = selectedPage >= 0 ? selectedPage : defaultPage
  const tableData = useMemo(() => ({
    month: month[page],
    weeks: weeksPerMonth[month[page]] || 0,
    data: fetchData.filter((record) => Number(record.id.slice(0, 2)) === month[page]),
  }), [month, page, weeksPerMonth, fetchData])
  const selectedQuarter = year === '2021' ? 0 : Math.floor(((month[page] || 1) - 1) / 3)
  const quarterData = analyzedData.totalQuarterData[selectedQuarter]

  const setPage = (nextPage) => {
    setSelectedMonth({ year, month: month[nextPage] })
  }

  useEffect(() => {
    setSelectedYear(year)
  }, [year, setSelectedYear])

  useEffect(() => {
    const previousYear = previousCurrentYear.current
    previousCurrentYear.current = thisYear
    setYear((selectedYear) => selectedYear === previousYear ? thisYear : selectedYear)
  }, [thisYear])
  const setTapHandler = (tapName) => {
    if (tapName === '승점' && year <= 2025) {
      setYear(thisYear)
    }
    setTap(tapName)
  }

  return (
    <div className="w-full relative h-full" style={{ top: '-10px' }}>
      {recordRoomLoadingFlag && (
        <div className="fixed left-[0rem] z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      <div className="flex flex-row w-full mb-2 p-1" style={{ fontFamily: 'DNFForgedBlade' }}>
        <div className="flex flex-row w-full justify-center" style={{ gap: '8%' }}>
          {tapName.map((name) => (
            <div
              key={name}
              className={`underline decoration-2 decoration-solid decoration-blue-700 dark:decoration-blue-300 cursor-pointer ${tap === name && 'text-goal dark:text-yellow-400'}`}
              style={{ width: 'fit-content' }}
              onClick={() => setTapHandler(name)}
            >
              {name}
            </div>
          ))}
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
