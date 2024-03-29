import {useEffect, useState, useRef} from 'react'
import LetsRecord from './components/LetsRecord.jsx'
import StatusBoard from './components/StatusBoard.jsx'
import WeeklyTeam from './components/WeeklyTeam.jsx'
import RecordRoom from './components/RecordRoom.jsx'
import { dataAnalysis } from "./apis/analyzeData.js";
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { Analytics } from "@vercel/analytics/react"
import styled from 'styled-components'
import './App.css'
import sun from '@/assets/sun2.png'

function App() {
    const [tap, setTap] = useState(0)
    const tapName = ['기록하기', '현황판', '기록실' ,'이번주 팀']
    const [data, setData] = useState([])
    const [analyzedData, setAnalyzedData] = useState({})
    const [weeklyTeamData, setWeeklyTeamData] = useState([])
    const [historyData, setHistoryData] = useState([])
    const [lastSeasonKings, setLastSeasonKings] = useState(null)
    const [registeredTeam, setRegisteredTeam] = useState(null)
    const headerRef = useRef(null)
    const [headerHeight, setHeaderHeight] = useState(0)
    const [open, setOpen] = useState(false)
    const [weeklyTeamLive, setWeeklyTeamLive] = useState(false)
    const [showFooter, setSHowFooter] = useState(true)

    const dataGeneration = async () => {
        const collectionRef = collection(db, '2024')
        const weeklyTeamRef = collection(db, 'weeklyTeam')
        const historyRef = collection(db, 'history')
        const snapshot = await getDocs(collectionRef)
        const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
        const historySnapshot = await getDocs(historyRef)
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        const fetchedHistoryData = historySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        setData(fetchedData)
        setWeeklyTeamData(fetchedWeeklyTeamData)
        setHistoryData(fetchedHistoryData)

        const lastDate = fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id
        const lastDateMonth = parseInt(lastDate.slice(0, 2), 10) - 1
        const lastDateDay = parseInt(lastDate.slice(2, 4), 10) + 1

        const today = new Date()
        const lastTeamDate = new Date(today.getFullYear(), lastDateMonth, lastDateDay)

        if (lastTeamDate > today) {
            if (fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id) {
                setWeeklyTeamLive(true)
            }
        }
    }

    // 지난 시즌 수상자 세팅
    useEffect(() => {
        if (historyData) {
            const item = historyData.find(data => data.id === 'last_season')
            if (item) {
                setLastSeasonKings(item.data)
            }
        }
    }, [historyData]);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.clientHeight)
        }
        dataGeneration()
        const fetchAnalysis = async () => {
            const data = await dataAnalysis()
            setAnalyzedData(data)
        }
        fetchAnalysis()
    }, [])

    // 위클리 팀 등록
    useEffect(() => {
        const registerTeam = async () => {
            const docRef = doc(db, 'weeklyTeam', registeredTeam.id)
            await setDoc(docRef, registeredTeam.data)
            console.log("Document written with ID: ", docRef.id);
        }
        if (registeredTeam) {
            registerTeam()
        }
    }, [registeredTeam])

      return (
          <div className='flex flex-col items-center' style={{height: '100vh'}}>
              <Analytics />
              <header ref={headerRef} className='flex flex-col items-center w-full top-5'>
                  <span className='relative text-green-800' style={{ left: '4px', letterSpacing: '3px', fontSize: '35px', fontFamily: 'Giants-Inline', fontStyle: 'normal', fontWeight: '400' }}>FLFC</span>
                  <span className='mb-3 text-yellow-500' style={{ fontSize: '8px', fontFamily: 'SUITE-Regular', fontStyle: 'normal', fontWeight: '200' }}>Football Love Futsal Club</span>
                  <div
                      className='flex flex-row justify-around w-full border-double border-0 border-b-2 border-t-2 border-green-500 mb-5 p-2'
                      style={{fontFamily: 'DNFForgedBlade'}}>
                      <div
                          className={`relative cursor-pointer w-full ${tap === 0 && 'text-yellow-500'}`}
                          onClick={() => setTap(0)}><span>{open && <Live $left='-3px'>Live</Live>}{tapName[0]}</span>
                      </div>
                      {/*<span className={`relative top-1`}>*</span>*/}
                      <Sun className='spin'/>
                      <div
                          className={`cursor-pointer w-full ${tap === 1 && 'text-yellow-500'}`}
                          onClick={() => setTap(1)}><span className='relative'><Live $left='-13px'>Live</Live>{tapName[1]}</span>
                      </div>
                      {/*<span className={`relative top-1`}>*</span>*/}
                      <Sun className='spin'/>
                      <div
                          className={`relative cursor-pointer w-full ${tap === 2 && 'text-yellow-500'}`}
                          onClick={() => setTap(2)}>{tapName[2]}
                      </div>
                      {/*<span className={`relative top-1`}>*</span>*/}
                      <Sun className='spin'/>
                      <div
                          className={`relative cursor-pointer w-full ${tap === 3 && 'text-yellow-500'}`}
                          onClick={() => setTap(3)}><span>{weeklyTeamLive && <Live $left='-3px'>Live</Live>}{tapName[3]}</span>
                      </div>
                  </div>
              </header>
              {/*{[1].includes(tap) && <div className='w-full h-32'></div>}*/}
              {tap === 0 && <LetsRecord headerHeight={headerHeight} setOpen={setOpen} open={open} recordData={data} weeklyTeamData={weeklyTeamData[weeklyTeamData.length - 1]} setTap={setTap} />}
              {tap === 1 && <StatusBoard propsData={data} analyzedData={analyzedData} lastSeasonKings={lastSeasonKings} setTap={setTap} />}
              {tap === 2 && <RecordRoom propsData={data} analyzedData={analyzedData} propsSetTap={setTap} />}
              {tap === 3 && <WeeklyTeam propsData={weeklyTeamData} setRegisteredTeam={setRegisteredTeam} setTap={setTap} setWeeklyTeamLive={setWeeklyTeamLive} setShowFooter={setSHowFooter}/>}
              {[0, 3].includes(tap) && !open && showFooter &&
                  <footer className='absolute bottom-3'>
                      <CopyRight>
                          Developed by. Seungho Lee
                      </CopyRight>
                      <CopyRight>
                          {/*Copyright*/}
                          Copyright 2024 Seungho Lee. All rights reserved.
                      </CopyRight>
                  </footer>
              }
          </div>
      )
}

export default App

const CopyRight = styled.span`
    font-size: 12px;
    font-family: "Hahmlet", serif;
    font-style: normal;
    font-weight: 400;
    color: #5a5a5a;
    display: flex;
    justify-content: center;
    margin-top: 5px;
    width: 100%;
    @media (max-width: 821px) {
        font-size: 8px;
    };
`
 const Sun = styled.span`
     position: relative;
     width: 100px;
     height: 24px;
     background-image: url(${sun});
     background-position: center;
     background-repeat: no-repeat;
     background-size: 42% 37%;
 `

const Live = styled.span`
    position: absolute;
    left: ${props => props.$left};
    bottom: 16px;
    font-family: 'DNFBitBitv2', serif;
    font-size: 9px;
    color: #bb2649;
    transform: rotate(-17deg);
`