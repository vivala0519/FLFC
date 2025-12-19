import { useEffect, useState } from 'react'
import DataTable from '../../DataTable.jsx'
import './LetsRecord.css'
import { dataAnalysis } from '../../../apis/analyzeData.js'

const StatusBoard = (props) => {
  const { propsData } = props

  const [analyzedData, setAnalyzedData] = useState({})
  const [lastSeasonKings, setLastSeasonKings] = useState({
    goal_king: '',
    assist_king: '',
    attendance_king: [],
  })

  const fetchAnalysis = async () => {
    const data = await dataAnalysis(0)
    setAnalyzedData(data)
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  useEffect(() => {
    if (analyzedData['active']) {
      setLastSeasonKings(analyzedData['active']['lastSeasonKings'])
    }
  }, [analyzedData])

  return (
    <div className="w-full relative" style={{ top: '-10px' }}>
      <div>
        <DataTable
          tap={'현황판'}
          tableData={propsData}
          analyzedData={analyzedData}
          lastSeasonKings={lastSeasonKings}
        />
      </div>
    </div>
  )
}

export default StatusBoard