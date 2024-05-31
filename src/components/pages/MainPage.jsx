import {useEffect, useRef, useState} from 'react'
import { Analytics } from '@vercel/analytics/react'
import LetsRecord from '@/components/templates/ParentTap/LetsRecord.jsx'
import StatusBoard from '@/components/templates/ParentTap/StatusBoard.jsx'
import RecordRoom from '@/components/templates/ParentTap/RecordRoom.jsx'
import WeeklyTeam from '@/components/templates/ParentTap/WeeklyTeam.jsx'
import {collection, doc, getDocs, setDoc} from 'firebase/firestore'
import {db} from '../../../firebase.js'
import {dataAnalysis} from '@/apis/analyzeData.js'

import Header from "../organisms/Header.jsx";
import Footer from "../organisms/Footer.jsx";

const MainPage = () => {
  const [tap, setTap] = useState(0)
  const [data, setData] = useState([])
  const [analyzedData, setAnalyzedData] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState([])
  const [registeredTeam, setRegisteredTeam] = useState(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const [showFooter, setSHowFooter] = useState(true)
  let lastWeeklyTeamId = null;

  const dataGeneration = async () => {
    const collectionRef = collection(db, '2024')
    const weeklyTeamRef = collection(db, 'weeklyTeam')
    const snapshot = await getDocs(collectionRef)
    const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
    const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    setData(fetchedData)
    setWeeklyTeamData(fetchedWeeklyTeamData)

    lastWeeklyTeamId = fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id
  }

  useEffect(() => {
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
      console.log("Document written with ID: ", docRef.id)
    }
    if (registeredTeam) {
      registerTeam()
    }
  }, [registeredTeam])

  return (
    <div className='flex flex-col items-center' style={{height: '100vh'}}>
      <Analytics />
      <Header tap={tap} setTap={setTap} setHeaderHeight={setHeaderHeight} lastDate={lastWeeklyTeamId} />
      {tap === 0 &&
      <LetsRecord headerHeight={headerHeight} setOpen={setOpen} open={open} recordData={data} weeklyTeamData={weeklyTeamData[weeklyTeamData.length - 1]} setTap={setTap}/>}
      {tap === 1 && <StatusBoard propsData={data} analyzedData={analyzedData} setTap={setTap}/>}
      {tap === 2 && <RecordRoom propsData={data} analyzedData={analyzedData} propsSetTap={setTap}/>}
      {tap === 3 && <WeeklyTeam propsData={weeklyTeamData} setRegisteredTeam={setRegisteredTeam} setTap={setTap} setShowFooter={setSHowFooter}/>}
      {[0, 3].includes(tap) && !open && showFooter &&
        <Footer />
      }
  </div>
)}

export default MainPage