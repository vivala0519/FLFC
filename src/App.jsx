import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import updateVotes from '@/hooks/updateVotes.js'
import useUpdateRecords from '@/hooks/updateRecords.js'
import updateMembers from '@/hooks/updateMembers.js'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import VotingPage from '@/components/pages/VotingPage.jsx'
import DevPage from '@/components/pages/DevPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'

import './App.css'

const App = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [recordRoomLoadingFlag, setRecordRoomLoadingFlag] = useState(false)
  updateCurrentTime()
  useUpdateRecords(selectedYear, setRecordRoomLoadingFlag)
  updateMembers()
  updateVotes()

  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)

    const handleChange = (e) => {
      setIsDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              isDarkMode={isDarkMode}
              setSelectedYear={setSelectedYear}
              recordRoomLoadingFlag={recordRoomLoadingFlag}
              test={false}
            />
          }
        />
        <Route path="/test" element={<MainPage test={true} />} />
        <Route
          path="/weeklyTeam"
          element={
            <MainPage
              weeklyTeamUrl={true}
              isDarkMode={isDarkMode}
              setSelectedYear={setSelectedYear}
              recordRoomLoadingFlag={recordRoomLoadingFlag}
            />
          }
        />
        <Route path="/vote" element={<VotingPage />} isDarkMode={isDarkMode} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dev" element={<DevPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
