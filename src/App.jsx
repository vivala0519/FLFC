import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import updateVotes from '@/hooks/updateVotes.js'
import useUpdateRecords from '@/hooks/updateRecords.js'
import useUpdateMembers from '@/hooks/updateMembers.js'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import VotingPage from '@/components/pages/VotingPage.jsx'
import DevPage from '@/components/pages/DevPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'
import useTheme from '@/hooks/useTheme.js'

import './App.css'

const App = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [recordRoomLoadingFlag, setRecordRoomLoadingFlag] = useState(false)
  updateCurrentTime()
  useUpdateRecords(selectedYear, setRecordRoomLoadingFlag)
  useUpdateMembers()
  updateVotes()

  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              setSelectedYear={setSelectedYear}
              recordRoomLoadingFlag={recordRoomLoadingFlag}
              test={false}
            />
          }
        />
        <Route
          path="/weeklyTeam"
          element={
            <MainPage
              weeklyTeamUrl={true}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              setSelectedYear={setSelectedYear}
              recordRoomLoadingFlag={recordRoomLoadingFlag}
            />
          }
        />
        <Route path="/vote" element={<VotingPage isDarkMode={isDarkMode} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dev" element={<DevPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
