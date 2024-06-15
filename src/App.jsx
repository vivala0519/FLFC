import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'
import updateRecords from '@/hooks/updateRecords.js'
import './App.css'

const App = () => {
  updateCurrentTime()
  updateRecords()

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<MainPage />} />
        <Route path='/admin' element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App