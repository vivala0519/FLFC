import { useEffect, useState } from 'react'
import DataTable from '../../DataTable.jsx'
import getRecords from '@/hooks/getRecords.js'
import './LetsRecord.css'

const hasDisplayableStatusBoardData = (statusBoardStat) => {
  const totalData = statusBoardStat?.active?.totalData
  if (!(totalData instanceof Map) || totalData.size === 0) return false

  const statKeys = ['출석', '골', '어시', '승점', '경기']
  return Array.from(totalData.values()).some((stats) =>
    statKeys.some((key) => Number(stats?.[key] || 0) > 0),
  )
}

const StatusBoard = () => {
  const { statusBoardStat } = getRecords()
  const [analyzedData, setAnalyzedData] = useState(null)
  const [lastSeasonKings, setLastSeasonKings] = useState({
    goal_king: '',
    assist_king: '',
    attendance_king: [],
    point_king: '',
  })
  const [loadingFlag, setLoadingFlag] = useState(false)

  useEffect(() => {
    setLoadingFlag(true)
    if (hasDisplayableStatusBoardData(statusBoardStat)) {
      setAnalyzedData(statusBoardStat)
      setLoadingFlag(false)
    } else {
      setAnalyzedData(null)
    }
  }, [statusBoardStat])

  useEffect(() => {
    if (analyzedData?.active) {
      setLastSeasonKings(analyzedData.active.lastSeasonKings)
    }
  }, [analyzedData])

  return (
    <div className="w-full relative" style={{ top: '-10px' }}>
      {(loadingFlag || !analyzedData) && (
        <div className="fixed left-[0rem] z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      {analyzedData && (
        <DataTable
          tap={'현황판'}
          analyzedData={analyzedData}
          lastSeasonKings={lastSeasonKings}
        />
      )}
    </div>
  )
}

export default StatusBoard
