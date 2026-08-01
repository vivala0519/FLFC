import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { doc, setDoc } from 'firebase/firestore'
import { getDatabase, ref, get } from 'firebase/database'
import getRecords from '@/hooks/getRecords.js'
import getTimes from '@/hooks/getTimes.js'

import { db } from '../../../firebase.js'

import Header from '@/components/organisms/Header.jsx'
import Footer from '@/components/organisms/Footer.jsx'
import TapTemplate from '@/components/templates/TapTemplate.jsx'

const makeWeeklyTeamId = (date = new Date()) => {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yy}${mm}${dd}`
}

const makeBlankWeeklyTeamData = () => ({
  1: ['', '', '', '', '', ''],
  2: ['', '', '', '', '', ''],
  3: ['', '', '', '', '', ''],
})

const MainPage = (props) => {
  const { isDarkMode, test, weeklyTeamUrl, setSelectedYear, recordRoomLoadingFlag } = props
  const { totalWeeklyTeamData } = getRecords()
  const { time: { currentTime } } = getTimes()
  const [tap, setTap] = useState(0)
  const [open, setOpen] = useState(false)
  const [registeredTeam, setRegisteredTeam] = useState(null)
  const [showFooter, setShowFooter] = useState(true)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [lastWeeklyTeamId, setLastWeeklyTeamId] = useState(null)
  const [testFlag, setTestFlag] = useState(false)
  const autoRegisteredWeeklyTeamIdRef = useRef(null)

  const pageStyle = `flex flex-col items-center h-[95vh] ${isDarkMode ? 'dark' : ''}`

  // Data Generation
  useEffect(() => {
    const run = async () => {
      const rtdb = await getDatabase()
      const maintenanceRef = ref(rtdb, 'maintenance')
      const snap = await get(maintenanceRef)
      setTestFlag(snap.val())
      if (totalWeeklyTeamData?.length) {
        setLastWeeklyTeamId(totalWeeklyTeamData[totalWeeklyTeamData.length - 1].id)
      }
    }
    run()
  }, [tap, totalWeeklyTeamData])

  // 위클리 팀 등록
  useEffect(() => {
    if (registeredTeam) {
      ;(async () => {
        const docRef = doc(db, 'weeklyTeam', registeredTeam.id)
        await setDoc(docRef, registeredTeam.data)
        console.log('Document written with ID: ', registeredTeam.id)
        setRegisteredTeam(null)
      })()
    }
  }, [registeredTeam])

  useEffect(() => {
    if (!Array.isArray(totalWeeklyTeamData)) return
    if (currentTime.getDay() !== 0) return

    const weeklyTeamId = makeWeeklyTeamId(currentTime)
    const alreadyRegistered = totalWeeklyTeamData.some(
      (weeklyTeam) => weeklyTeam.id === weeklyTeamId,
    )

    if (alreadyRegistered) return
    if (autoRegisteredWeeklyTeamIdRef.current === weeklyTeamId) return

    autoRegisteredWeeklyTeamIdRef.current = weeklyTeamId
    setRegisteredTeam({
      id: weeklyTeamId,
      data: makeBlankWeeklyTeamData(),
    })
  }, [currentTime, totalWeeklyTeamData])

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
        headerHeight={headerHeight}
        setShowFooter={setShowFooter}
        recordRoomLoadingFlag={recordRoomLoadingFlag}
        setSelectedYear={setSelectedYear}
        setRegisteredTeam={setRegisteredTeam}
      />
      {[0].includes(tap) && !open && showFooter && <Footer />}
    </div>
  )
}

export default MainPage
