import {useEffect, useState} from 'react'
import LetsRecord from './components/LetsRecord.jsx'
import RecordRoom from './components/RecordRoom.jsx'
import WeeklyTeam from './components/WeeklyTeam.jsx'
import './App.css'

function App() {
    const [tap, setTap] = useState(0)
    const tapName = ['기록하기', '기록실', '이번 주 팀']

    useEffect(() => {

    }, []);

      return (
          <div className='flex flex-col'>
              <header className='relative flex flex-col items-center w-full'>
                  <span>FLFC</span>
                  <div
                      className='flex flex-row justify-evenly w-full border-solid border-2 border-indigo-600'>
                      {tapName.map((tap, index) => <div key={index} onClick={() => setTap(index)}>{tap}</div>)}
                  </div>
              </header>
              {tap === 0 ? <LetsRecord/> : tap === 1 ? <RecordRoom/> : <WeeklyTeam/>}
              <footer></footer>
          </div>
      )
}

export default App
