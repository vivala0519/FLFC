import {useEffect, useState} from 'react'
import LetsRecord from './components/LetsRecord.jsx'
import RecordRoom from './components/RecordRoom.jsx'
import WeeklyTeam from './components/WeeklyTeam.jsx'
import { dataAnalysis } from "./apis/analyzeData.js";
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import styled from 'styled-components'
import './App.css'

function App() {
    const [tap, setTap] = useState(0)
    const tapName = ['기록하기', '기록실', '이번 주 팀']
    const [data, setData] = useState([])
    const [analyzedData, setAnalyzedData] = useState({})
    const [weeklyTeamData, setWeeklyTeamData] = useState([])
    const [registeredTeam, setRegisteredTeam] = useState(null)

    const dataGeneration = async () => {
        const collectionRef = collection(db, '2024');
        const weeklyTeamRef = collection(db, 'weeklyTeam');
        const snapshot = await getDocs(collectionRef);
        const weeklyTeamSnapshot = await getDocs(weeklyTeamRef);
        const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
        setData(fetchedData)
        setWeeklyTeamData(fetchedWeeklyTeamData)
    }

    useEffect(() => {
        dataGeneration()
        const fetchAnalysis = async () => {
            const data = await dataAnalysis()
            setAnalyzedData(data)
        }
        fetchAnalysis()
    }, []);

    useEffect(() => {
        console.log(registeredTeam)
        const registerTeam = async () => {
            const docRef = doc(db, 'weeklyTeam', registeredTeam.id)
            await setDoc(docRef, registeredTeam.data)
            console.log("Document written with ID: ", docRef.id);
        }
        if (registeredTeam) {
            registerTeam()
        }
    }, [registeredTeam])

    const [open, setOpen] = useState(false)

      return (
          <div className='flex flex-col items-center'>
              <header className='flex flex-col items-center w-full absolute top-5'>
                  <span className='mb-5' style={{ letterSpacing: '3px', fontSize: '35px', fontFamily: 'Giants-Inline', fontStyle: 'normal', fontWeight: '400'}}>FLFC</span>
                  <div
                      className='flex flex-row justify-around w-full border-solid border-0 border-b-2 border-t-2 border-indigo-600 mb-5 p-2' style={{ fontFamily: 'KBO-Dia-Gothic_bold'}}>
                      {tapName.map((tap, index) => <div className='cursor-pointer' key={index} onClick={() => setTap(index)}>{tap}</div>)}
                  </div>
              </header>
              {[0].includes(tap) && <div className='w-full mb-10'></div>}
              {[1].includes(tap) && <div className='w-full h-32'></div>}
              {tap === 0 ? <LetsRecord setOpen={setOpen} open={open}/> : tap === 1 ? <RecordRoom propsData={data} analyzedData={analyzedData} /> : <WeeklyTeam propsData={weeklyTeamData} setRegisteredTeam={setRegisteredTeam}/>}
              {[0, 2].includes(tap) && !open &&
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
