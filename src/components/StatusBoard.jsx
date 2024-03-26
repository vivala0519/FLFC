import {useEffect, useState} from 'react'
import DataTable from './DataTable'
import styled from 'styled-components'
import './LetsRecord.css'
import help from '@/assets/help2.png'

function StatusBoard(props) {
  const {propsData, analyzedData, lastSeasonKings} = props
  // const tapName = ['출석', '골', '어시']
  // const [tap, setTap] = useState('출석')
  // const [month, setMonth] = useState([])
  // const [weeksPerMonth, setWeeksPerMonth] = useState([])
  // const [page, setPage] = useState(0)
  // const [tableData, setTableData] = useState({})
  // const [quarterData, setQuarterData] = useState([])
  //
  // useEffect(() => {
  //   // 초기 페이지 현재 월로 설정
  //   const currentTime = new Date()
  //   const month = currentTime.getMonth()
  //   setPage(month)
  //
  //   // 월별 주차 계산
  //   const monthSet = new Set()
  //   const weeksByMonth = propsData?.reduce((acc, cur) => {
  //     const key = Number(cur.id.slice(0, 2))
  //     monthSet.add(key)
  //     acc[key] ? acc[key]++ : (acc[key] = 1)
  //     return acc
  //   }, {})
  //   // 진행된 월 set
  //   setMonth([...monthSet])
  //   setWeeksPerMonth(weeksByMonth)
  // }, [])
  //
  // useEffect(() => {
  //   // console.log(propsData)
  // }, [propsData])
  //
  // useEffect(() => {
  //   const tableData = propsData?.filter(data => Number(data.id.slice(0, 2)) === month[page])
  //   const obj = {month: month[page], weeks: weeksPerMonth[month[page]], data: tableData}
  //   setTableData(obj)
  //
  //   const selectedMonth = month[page]
  //   let quarterData = []
  //   if (selectedMonth <= 3) {
  //     quarterData = analyzedData.totalQuarterData[0]
  //   }
  //   else if (selectedMonth > 3 && selectedMonth <= 6) {
  //     quarterData = analyzedData.totalQuarterData[1]
  //   }
  //   else if (selectedMonth > 6 && selectedMonth <= 9) {
  //     quarterData = analyzedData.totalQuarterData[2]
  //   } else {
  //     quarterData = analyzedData.totalQuarterData[3]
  //   }
  //   setQuarterData(quarterData)
  //
  // }, [page, month, weeksPerMonth]);

  return (
      <div className='w-full relative' style={{top: '-10px'}}>
        {/*<div className='flex flex-row justify-center gap-14 w-full mb-3 p-2' style={{fontFamily: 'Giants-Inline'}}>*/}
        {/*  /!*<div className={`border-solid border-0 border-b-2 cursor-pointer text-sm border-indigo-600 ${tap === '현황판' && 'text-rose-600'}`} style={{width: '40px'}}*!/*/}
        {/*  /!*     onClick={() => setTap(tapName[0])}>현황판*!/*/}
        {/*  /!*</div>*!/*/}
        {/*  <Tap className={`border-solid border-0 border-b-2 cursor-pointer text-sm border-indigo-600 ${tap === '출석' && 'text-rose-600'}`} style={{width: '40px'}}*/}
        {/*       onClick={() => setTap(tapName[0])}>출석*/}
        {/*  </Tap>*/}
        {/*  <Tap className={`border-solid border-0 border-b-2 cursor-pointer text-sm border-indigo-600 ${tap === '골' && 'text-rose-600'}`} style={{width: '40px'}}*/}
        {/*       onClick={() => setTap(tapName[1])}>골*/}
        {/*  </Tap>*/}
        {/*  <Tap className={`border-solid border-0 border-b-2 cursor-pointer text-sm border-indigo-600 ${tap === '어시' && 'text-rose-600'}`} style={{width: '40px'}}*/}
        {/*       onClick={() => setTap(tapName[2])}>어시*/}
        {/*  </Tap>*/}
        {/*  <Help />*/}
        {/*</div>*/}
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