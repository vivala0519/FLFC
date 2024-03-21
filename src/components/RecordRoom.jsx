import {useEffect, useState} from 'react'
import DataTable from './DataTable'
import styled from 'styled-components'

function RecordRoom(props) {
    const {propsData, analyzedData} = props
    const tapName = ['현황판', '출석', '골', '어시']
    const [tap, setTap] = useState('현황판')
    const [month, setMonth] = useState([])
    const [weeksPerMonth, setWeeksPerMonth] = useState([])
    const [page, setPage] = useState(0)
    const [tableData, setTableData] = useState({})

    useEffect(() => {
        const monthSet = new Set()

        const weeksByMonth = propsData?.reduce((acc, cur) => {
            const key = Number(cur.id.slice(0, 2))
            monthSet.add(key)
            acc[key] ? acc[key]++ : (acc[key] = 1)
            return acc
        }, {})
        setMonth([...monthSet])
        setWeeksPerMonth(weeksByMonth)
    }, [])

    useEffect(() => {
        // console.log(propsData)
    }, [propsData])

    useEffect(() => {
        const tableData = propsData?.filter(data => Number(data.id.slice(0, 2)) === month[page])
        const obj = {month: month[page], weeks: weeksPerMonth[month[page]], data: tableData}
        // console.log(obj)
        setTableData(obj)
    }, [page, month, weeksPerMonth]);

    return (
      <div className='w-full'>
            <div
              className='flex flex-row justify-around w-full mb-5 p-2' style={{ fontFamily: 'Giants-Inline'}}>
              {tapName.map((tap, index) => <div className='border-solid border-0 border-b-2 border-indigo-600 cursor-pointer text-sm' key={index} onClick={() => setTap(tapName[index])}>{tap}</div>)}
          </div>
          <div>
              <DataTable tap={tap} tableData={tableData} analyzedData={analyzedData}/>
          </div>
      </div>
    )
}

export default RecordRoom

const Table = styled.div`
    @media (max-width: 812px) {
        width: 340px;
    }
`