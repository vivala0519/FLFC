import {useEffect, useState} from 'react'

function LetsRecord() {
  const [round, setRound] = useState(1)
  const [scorer, setScorer] = useState(['', '', ''])
  const [assistant, setAssistant] = useState(['', '', ''])
  const [todayRecord, setTodayRecord] = useState([])
  const currentTime = new Date()
    console.log(currentTime)
    console.log(currentTime.getDay())
    console.log(currentTime.getHours())

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
        <>
            <div className='flex flex-col items-center w-full'>
                {/*Today Record*/}
                <span className='mt-3 mb-1 underline underline-offset-1' style={{ fontFamily: 'Giants-Inline'}}>{"Today's Record"}</span>
                <hr className='w-1/2 mb-5 border-indigo-600'/>
                <div className='w-full h-96 overflow-auto'>
                    {
                        todayRecord.map((record, index) =>
                            <div key={index} className='mb-2'>
                                <span style={{ fontSize: '12px', fontFamily: 'Hahmlet'}}> {index + 1}R : {record.time}</span>
                                <div className='flex mt-2 mb-2 gap-2 items-center'>
                                    <span className='flex justify-center' style={{width: '13%', fontFamily: 'Giants-Inline'}}>골</span>
                                    {record.goal.map((el, index) => <span key={index}
                                                                          className='border-solid border-2 border-indigo-600'
                                                                          style={{width: '26%', fontFamily: 'Hahmlet'}}>{el}</span>)}
                                </div>
                                <div className='flex gap-2 items-center'>
                                    <span className='flex justify-center' style={{width: '13%', fontFamily: 'Giants-Inline'}}>어시</span>
                                    {record.assist.map((el, index) => <span key={index}
                                                                            className='border-solid border-2 border-indigo-600'
                                                                            style={{width: '26%'}}>{el}</span>)}
                                </div>
                            </div>
                        )
                    }
                </div>
                <hr className='w-1/2 mt-5 mb-5 border-indigo-600'/>
                {/*Write Container*/}
                <div className=''>
                    <span className='flex justify-center mb-3'>{round + 'R'}</span>
                    <div className='flex mb-2 gap-2 items-center'>
                        <span className='flex justify-center' style={{width: '13%', fontFamily: 'Giants-Inline'}}>골</span>
                        {scorer.map((el, index) => <input className='border-solid border-2 border-indigo-600' key={index} value={el} style={{width: '26%'}}/>)}
                    </div>
                    <div className='flex gap-2 items-center'>
                        <span className='flex justify-center' style={{width: '13%', fontFamily: 'Giants-Inline'}}>어시</span>
                        {assistant.map((el, index) => <input className='border-solid border-2 border-indigo-600' key={index} value={el} style={{width: '26%'}}/>)}
                    </div>
                    <button className='mt-5'>등록</button>
                </div>
            </div>
        </>
    )
}

export default LetsRecord