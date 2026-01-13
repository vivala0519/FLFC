import { useEffect, useState } from 'react'
import DataTable from '../../DataTable.jsx'
import getRecords from '@/hooks/getRecords.js'
import './LetsRecord.css'

const StatusBoard = () => {
  const { statusBoardStat } = getRecords()
  const [analyzedData, setAnalyzedData] = useState({})
  const [lastSeasonKings, setLastSeasonKings] = useState({
    goal_king: '',
    assist_king: '',
    attendance_king: [],
  })
  const [loadingFlag, setLoadingFlag] = useState(false)

  useEffect(() => {
    setLoadingFlag(true)
    if (statusBoardStat) {
      setAnalyzedData(statusBoardStat)
      setLoadingFlag(false)
    }
  }, [statusBoardStat])

  useEffect(() => {
    if (analyzedData['active']) {
      setLastSeasonKings(analyzedData['active']['lastSeasonKings'])
    }
  }, [analyzedData])

  return (
    <div className="w-full relative" style={{ top: '-10px' }}>
      {loadingFlag && (
        <div className="fixed left-[0rem] z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      <div>
        <DataTable
          tap={'현황판'}
          analyzedData={analyzedData}
          lastSeasonKings={lastSeasonKings}
        />
      </div>
    </div>
  )
}

export default StatusBoard