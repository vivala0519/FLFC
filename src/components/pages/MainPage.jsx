import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { getDatabase, ref, get } from 'firebase/database'

import { db } from '../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'
import { dataAnalysis } from '@/apis/analyzeData.js'

import Header from '@/components/organisms/Header.jsx'
import Footer from '@/components/organisms/Footer.jsx'
import TapTemplate from '@/components/templates/TapTemplate.jsx'

const MainPage = (props) => {
  const { isDarkMode, test, weeklyTeamUrl } = props
  const {
    time: { thisYear },
  } = getTimes()
  const [tap, setTap] = useState(0)
  const [data, setData] = useState([])
  const [open, setOpen] = useState(false)
  const [analyzedData, setAnalyzedData] = useState({})
  const [registeredTeam, setRegisteredTeam] = useState(null)
  const [showFooter, setShowFooter] = useState(true)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [lastWeeklyTeamId, setLastWeeklyTeamId] = useState(null)
  const [weeklyTeamData, setWeeklyTeamData] = useState([])
  const [testFlag, setTestFlag] = useState(false)

  const pageStyle = `flex flex-col items-center h-[95vh] ${isDarkMode ? 'dark' : ''}`

  // Data Generation
  useEffect(() => {
    const run = async () => {
      const rtdb = await getDatabase()
      const maintenanceRef = ref(rtdb, 'maintenance')
      const snap = await get(maintenanceRef)
      setTestFlag(snap.val())
      const collectionRef = collection(db, thisYear)
      const snapshot = await getDocs(collectionRef)
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      setData(fetchedData)

      const weeklyTeamRef = collection(db, 'weeklyTeam')
      const weeklyTeamSnapshot = await getDocs(weeklyTeamRef)
      const fetchedWeeklyTeamData = weeklyTeamSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      setWeeklyTeamData(fetchedWeeklyTeamData)

      const data = await dataAnalysis()
      setAnalyzedData(data)
      setLastWeeklyTeamId(
        fetchedWeeklyTeamData[fetchedWeeklyTeamData.length - 1].id,
      )
    }
    run()
  }, [tap])

  // 위클리 팀 등록
  useEffect(() => {
    if (registeredTeam) {
      ;(async () => {
        const docRef = doc(db, 'weeklyTeam', registeredTeam.id)
        await setDoc(docRef, registeredTeam.data)
        console.log('Document written with ID: ', registeredTeam.id)
      })()
    }
  }, [registeredTeam])

  useEffect(() => {
    if (weeklyTeamUrl) {
      setTap(3)
    }
  }, [weeklyTeamUrl])

  return (
    <div className={pageStyle}>
      {testFlag && (
          <div className="absolute z-20 bg-white dark:bg-black w-full h-full flex flex-col items-center justify-center">
            <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
            <span>점검중 이따 만나요~</span>
          </div>
      )}
      <Analytics />
      <Header
        tap={tap}
        setTap={setTap}
        lastDate={lastWeeklyTeamId}
        setHeaderHeight={setHeaderHeight}
      />
      <TapTemplate
        tap={tap}
        open={open}
        test={test}
        setTap={setTap}
        setOpen={setOpen}
        recordData={data}
        analyedData={analyzedData}
        headerHeight={headerHeight}
        setShowFooter={setShowFooter}
        weeklyTeamData={weeklyTeamData}
        setRegisteredTeam={setRegisteredTeam}
      />
      {[0].includes(tap) && !open && showFooter && <Footer />}
    </div>
  )
}

export default MainPage
