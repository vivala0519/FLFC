import {useEffect, useState} from 'react'
import {collection, doc, getDocs, setDoc} from 'firebase/firestore'
import {db} from '../../../firebase.js'
import { Analytics } from '@vercel/analytics/react'
import {dataAnalysis} from '@/apis/analyzeData.js'

import Header from '@/components/organisms/Header.jsx'
import Footer from '@/components/organisms/Footer.jsx'
import TapTemplate from '@/components/templates/TapTemplate.jsx'
import updateMembers from '@/hooks/updateMembers.js'

const MainPage = () => {
  const [tap, setTap] = useState(0)
  const [data, setData] = useState([])
  const [analyzedData, setAnalyzedData] = useState({})
  const [weeklyTeamData, setWeeklyTeamData] = useState([])
  const [registeredTeam, setRegisteredTeam] = useState(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [open, setOpen] = useState(false)
  const [showFooter, setShowFooter] = useState(true)
  const [lastWeeklyTeamId, setLastWeeklyTeamId] = useState(null)

  updateMembers()

  // Data Generation
  useEffect(() => {
    (async () => {
      const collectionRef = collection(db, '2024')
      const snapshot = await getDocs(collectionRef)
      const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      setData(fetchedData)

      const weeklyTeamRef = collection(db, 'weeklyTeam')
      const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
      const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      setWeeklyTeamData(fetchedWeeklyTeamData)

      const data = await dataAnalysis()
      setAnalyzedData(data)
      setLastWeeklyTeamId(fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id)
    })()
  }, [])

  // 위클리 팀 등록
  useEffect(() => {
    if (registeredTeam) {
      (async () => {
        const docRef = doc(db, 'weeklyTeam', registeredTeam.id)
        await setDoc(docRef, registeredTeam.data)
        console.log("Document written with ID: ", registeredTeam.id)
      })()
    }
  }, [registeredTeam])

  return (
    <div className='flex flex-col items-center h-[95vh]'>
      <Analytics />
      <Header tap={tap} setTap={setTap} setHeaderHeight={setHeaderHeight} lastDate={lastWeeklyTeamId} />
      <TapTemplate
        open={open}
        setOpen={setOpen}
        tap={tap}
        setTap={setTap}
        setShowFooter={setShowFooter}
        headerHeight={headerHeight}
        recordData={data}
        analyedData={analyzedData}
        weeklyTeamData={weeklyTeamData}
        setRegisteredTeam={setRegisteredTeam}
      />
      {[0, 3].includes(tap) && !open && showFooter &&
        <Footer />
      }
  </div>
)}

export default MainPage