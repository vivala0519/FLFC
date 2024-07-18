import {useEffect, useState} from 'react'
import DataTable from '../../DataTable.jsx'
import styled from 'styled-components'
import './LetsRecord.css'
import help from '@/assets/help2.png'
import {dataAnalysis} from "../../../apis/analyzeData.js";

const StatusBoard = (props) => {
    const {propsData} = props

    const [analyzedData, setAnalyzedData] = useState({})
    const [lastSeasonKings, setLastSeasonKings] = useState({goal_king: '', assist_king: '', attendance_king: []})

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
      <div className='w-full relative' style={{top: '-10px'}}>
        <div>
          <DataTable tap={'현황판'} tableData={propsData} analyzedData={analyzedData} lastSeasonKings={lastSeasonKings} />
        </div>
      </div>
  )
}

export default StatusBoard

const Help = styled.div`
    position: absolute;
    right: 0;
    width: 20px;
    height: 20px;
    &::after {
        position: absolute;
        content: '';
        background-image: url(${help});
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        width: 100%;
        height: 100%;
        right: 0;
    }
`

const Tap = styled.div`
    @media (min-width: 812px) {
        font-size: 21px;
    }
`