import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'
import updateRecords from '@/hooks/updateRecords.js'
import updateMembers from '@/hooks/updateMembers.js'
import './App.css'

const App = () => {
  updateCurrentTime()
  updateRecords()
  updateMembers()

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<MainPage />} />
        <Route path='/test' element={<MainPage test={true} />} />
        <Route path='/admin' element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App