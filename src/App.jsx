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
          <div className='flex flex-col items-center'>
              <header className='relative flex flex-col items-center w-full'>
                  <span className='mb-5' style={{ letterSpacing: '3px', fontSize: '25px', fontFamily: 'Giants-Inline', fontStyle: 'normal', fontWeight: '400'}}>FLFC</span>
                  <div
                      className='flex flex-row justify-around w-full border-solid border-0 border-b-2 border-t-2 border-indigo-600 mb-5 p-2' style={{ fontFamily: 'KBO-Dia-Gothic_bold'}}>
                      {tapName.map((tap, index) => <div key={index} onClick={() => setTap(index)}>{tap}</div>)}
                  </div>
              </header>
              {tap === 0 ? <LetsRecord/> : tap === 1 ? <RecordRoom/> : <WeeklyTeam/>}
              <footer></footer>
          </div>
      )
}

export default App
