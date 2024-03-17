import {useEffect, useState} from 'react'

function LetsRecord() {
  const [round, setRound] = useState(1)
  const [scorer, setScorer] = useState(['', '', ''])
  const [assistant, setAssistant] = useState(['', '', ''])
  const [todayRecord, setTodayRecord] = useState([])

  useEffect(() => {
    const dummy = [
      {goal: ['승호', '승호', '영진'], assist: ['승호'], time: '8:12'},
      {goal: ['영진', '승호', '지원'], assist: ['용병', '용병', '근한'], time: '8:45'},
      {goal: ['근한', '원효'], assist: ['영진', '근한'], time: '9:12'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
      {goal: ['승호', '승호', '승호'], assist: [], time: '9:24'},
    ]
    setTodayRecord(dummy)
  }, []);

  return (
      <div className='flex flex-col'>
        {/*Today Record*/}
        <span className='mt-3 mb-3'>{"Today's Record"}</span>
        <div className='h-96 overflow-auto'>
          {
            todayRecord.map((record, index) =>
                <div key={index}>
                  <span>{record.time}</span>
                  <div className='grid grid-cols-4 gap-3'>
                    <span className='flex justify-center'>골</span>
                  </div>
                  <div className='grid grid-cols-4 gap-3'>
                    <span className='flex justify-center'>어시</span>
                  </div>
                </div>
        )
          }
        </div>
        <hr className='mt-5 mb-5' />
        {/*Write Container*/}
        <span className='flex justify-center mb-2'>{round + 'R'}</span>
        <div className='flex mb-2 gap-2'>
          <span className='flex justify-center' style={{width: '13%'}}>골</span>
          {scorer.map((el, index) => <input className='border-solid border-2 border-indigo-600' key={index} value={el} style={{width: '26%'}}/>)}
        </div>
        <div className='flex gap-2'>
          <span className='flex justify-center' style={{width: '13%'}}>어시</span>
          {assistant.map((el, index) => <input className='border-solid border-2 border-indigo-600' key={index} value={el} style={{width: '26%'}}/>)}
        </div>
        <button className='mt-5'>등록</button>
      </div>
  )
}

export default LetsRecord