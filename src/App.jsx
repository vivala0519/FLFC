import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import updateVotes from '@/hooks/updateVotes.js'
import updateRecords from '@/hooks/updateRecords.js'
import updateMembers from '@/hooks/updateMembers.js'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import VotingPage from '@/components/pages/VotingPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'

import './App.css'

const App = () => {
  updateCurrentTime()
  updateRecords()
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
          element={<MainPage isDarkMode={isDarkMode} test={false} />}
        />
        <Route path="/test" element={<MainPage test={true} />} />
        <Route
          path="/weeklyTeam"
          element={<MainPage weeklyTeamUrl={true} isDarkMode={isDarkMode} />}
        />
        <Route path="/vote" element={<VotingPage />} isDarkMode={isDarkMode} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
