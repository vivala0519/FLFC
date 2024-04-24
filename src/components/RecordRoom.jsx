import {useEffect, useState} from 'react'
import DataTable from './DataTable'
import styled from 'styled-components'
import './LetsRecord.css'
import help from '@/assets/help.png'
import {collection, getDocs} from "firebase/firestore";
import {db} from "../../firebase.js";
import { dataAnalysis } from "../apis/analyzeData.js";
import { extractQuarterData } from '../apis/calculateQuarterData.js'

const RecordRoom = (props) => {
    const {propsSetTap} = props
    const [fetchData, setFetchData] = useState([])
    const [analyzedData, setAnalyzedData] = useState({})
    const tapName = ['출석', '골', '어시', '히스토리']
    const [tap, setTap] = useState('출석')
    const [year, setYear] = useState('2024')
    const [yearData, setYearData] = useState({})
    const [analyedYearData, setAnalyzedYearData] = useState({})
    const [month, setMonth] = useState([])
    const [weeksPerMonth, setWeeksPerMonth] = useState([])
    const [page, setPage] = useState(0)
    const [quarter, setQuarter] = useState()
    const [blockSetPage, setBlockSetPage] = useState(false)
    const [tableData, setTableData] = useState({})
    const [quarterData, setQuarterData] = useState([])
    const [showHelp, setShowHelp] = useState(false)
    const infoText = '각 분기마다 스탯은 초기화 됩니다.\n\n' +
        '다음 분기까지 현황판의 회원명 앞에\n득점왕/어시왕/출석왕 트로피 부착\n\n' +
        '출석\n' +
        '- 공동 1위의 경우 해당 인원 모두 인정.\n\n' +
        '득점 & 어시\n' +
        '- 공동 1위의 경우 다음 순서대로 1위를 가린다.\n' +
        '1. 출석 + 골 + 어시 총합 순\n' +
        '2. 1:1 PK(선공 가위바위보)\n\n' +
        '- 수상인원은 다음 분기 동일 부분 수상에서 제외.\n\n' +
        "- 각 분야의 1위가 같을 경우: 득점/어시 타이틀 수상이 우선\n- 득점, 어시가 겹칠경우: 두 분야중 더 높은 포인트를 기록한 분야로 수상.\n" +
        "-> '출석+골+어시 총합'이 다음으로 높은 인원이 대체 수상"


    const dataGeneration = async () => {
        const collectionRef = collection(db, year)
        const snapshot = await getDocs(collectionRef)
        let fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        fetchedData = fetchedData.filter(data => data.id !== 'last_season_kings')
        // setFetchData(fetchedData)
        const yearsData = {}
        yearsData[year] = fetchedData
        setYearData(yearsData)
    }
    const fetchAnalysis = async (quarter) => {
        if (quarter) {
            const data = await dataAnalysis(quarter)
            setAnalyzedData(data)
        }
    }

    const getYearData = async (year) => {
        const collectionRef = collection(db, year)
        const snapshot = await getDocs(collectionRef)
        let fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        fetchedData = fetchedData.filter(data => data.id !== 'last_season_kings')
        const quarterData = await extractQuarterData(year)

        const yearsData = {...yearData}
        yearsData[year] = fetchedData

        const analyzedYearsData = {...analyedYearData}
        analyzedYearsData[year] = quarterData

        setYearData(yearsData)
        setAnalyzedYearData(analyzedYearsData)
        setFetchData(fetchedData)
        setAnalyzedData(quarterData)
    }

    // 연도 변경
    useEffect(() => {
        setBlockSetPage(false)
        if (!yearData[year]) {
            getYearData(year)
        } else {
            setFetchData(yearData[year])
            setAnalyzedData(analyedYearData[year])
        }
    }, [year])

    useEffect(() => {
        // console.log(quarter)
        // if (quarter) {
        //     const tempData = {...analyzedData}
        //     tempData.members = analyzedData.totalQuarterData[quarter - 1].members
        //     setAnalyzedData(tempData)
        //     console.log(tempData)
        // }

        // dataGeneration()
        // fetchAnalysis(quarter)
    }, [quarter])

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
    }, [fetchData])

    useEffect(() => {
        const tableData = fetchData?.filter(data => Number(data.id.slice(0, 2)) === month[page])
        const obj = {month: month[page], weeks: weeksPerMonth[month[page]], data: tableData}
        setTableData(obj)

    }, [page, month, weeksPerMonth, fetchData]);

    useEffect(() => {
        const selectedMonth = month[page]
        let quarterData = []
        if (analyzedData?.totalQuarterData) {
            if (year === '2021') {
                quarterData = analyzedData.totalQuarterData[0]
            } else {
                if (selectedMonth <= 3) {
                    quarterData = analyzedData.totalQuarterData[0]
                }
                else if (selectedMonth > 3 && selectedMonth <= 6) {
                    quarterData = analyzedData.totalQuarterData[1]
                }
                else if (selectedMonth > 6 && selectedMonth <= 9) {
                    quarterData = analyzedData.totalQuarterData[2]
                } else {
                    quarterData = analyzedData.totalQuarterData[3]
                }
            }
        }
        setQuarterData(quarterData)

    }, [tableData, analyzedData])

    // 슬라이드 시 탭 이동
    const [startX, setStartX] = useState(null);
    const [moveX, setMoveX] = useState(null);

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
        setMoveX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setMoveX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        const diff = startX - moveX;
        if (diff > 75) {
            propsSetTap(3)
        } else if (diff < -75) {
            propsSetTap(1)
        }
        setStartX(null);
        setMoveX(null);
    };


    return (
      <div className='w-full relative' style={{top: '-10px'}}
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}>
          <div className='flex flex-row w-full mb-2 p-1' style={{fontFamily: 'DNFForgedBlade'}}>
              {/*<div className={`border-solid border-0 border-b-2 cursor-pointer text-sm border-green-600 ${tap === '현황판' && 'text-rose-600'}`} style={{width: '40px'}}*/}
              {/*     onClick={() => setTap(tapName[0])}>현황판*/}
              {/*</div>*/}
              <div className='flex flex-row w-full justify-center' style={{gap : '10%'}}>
                  <Tap className={`underline decoration-2 decoration-solid decoration-green-700 cursor-pointer ${tap === '출석' && 'text-yellow-500'}`}
                       style={{width: '20%'}} onClick={() => setTap(tapName[0])}>출석
                  </Tap>
                  <Tap className={`underline decoration-2 decoration-solid decoration-green-700 cursor-pointer ${tap === '골' && 'text-yellow-500'}`}
                       style={{width: '20%'}} onClick={() => setTap(tapName[1])}>골
                  </Tap>
                  <Tap className={`underline decoration-2 decoration-solid decoration-green-700 cursor-pointer ${tap === '어시' && 'text-yellow-500'}`}
                       style={{width: '20%'}} onClick={() => setTap(tapName[2])}>어시
                  </Tap>
                  {/*<Tap className={`underline decoration-2 decoration-solid decoration-green-300 cursor-pointer text-sm ${tap === '히스토리' && 'text-yellow-600'}`}*/}
                  {/*     onClick={() => setTap(tapName[3])}>히스토리*/}
                  {/*</Tap>*/}
              </div>
              <Help onClick={() => setShowHelp(true)}/>
          </div>
          <div>
              {
                  ['현황판', '출석', '골', '어시'].includes(tap)
                      ? (<DataTable tap={tap} tableData={tableData} analyzedData={analyzedData} page={page} setPage={setPage} year={year} setYear={setYear} month={month} quarterData={quarterData} quarter={quarter} setQuarter={setQuarter} setBlockSetPage={setBlockSetPage} />)
                      : <div></div>
              }

          </div>
          {showHelp &&
              <div className='absolute top-0 bg-amber-50 overflow-hidden whitespace-break-spaces p-4 text-xs w-fit h-fit right-0 text-black' style={{filter: 'drop-shadow(2px 4px 13px black)'}}>
                  {infoText}
                  <div className='absolute top-1 -right-2 bg-transparent text-center cursor-pointer' style={{width: '40px', height: '30px'}} onClick={()=> setShowHelp(false)}>
                      <span className='relative cursor-pointer'>X</span>
                  </div>
              </div>
          }
      </div>
    )
}

export default RecordRoom

const Help = styled.div`
    position: absolute;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
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