import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainPage from '@/components/pages/MainPage.jsx'
import AdminPage from '@/components/pages/AdminPage.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<MainPage />} />
        <Route path='/admin' element={<AdminPage />} />
        {/*<Route path='/admin' element={<AdminPage weeklyTeamData={weeklyTeamData[weeklyTeamData.length - 1]}  recordData={data} />}/>*/}
      </Routes>
    </BrowserRouter>
  )
}

export default App