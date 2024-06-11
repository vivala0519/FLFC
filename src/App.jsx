import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import updateCurrentTime from '@/hooks/updateCurrentTime.js'
import './App.css'

const App = () => {
  updateCurrentTime()
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