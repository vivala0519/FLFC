import {useEffect, useState} from 'react'
import { getDatabase, ref, get, set, child, onValue } from 'firebase/database'
import { uid } from "uid"
import styled from 'styled-components'
import './LetsRecord.css'

function LetsRecord(props) {
  const {open, setOpen} = props
  // const [open, setOpen] = useState(false)
  const [round, setRound] = useState(1)
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  const [todayRecordType1, setTodayRecordType1] = useState([])
  const [todayRecordType2, setTodayRecordType2] = useState([])
  const [todayRecordObject, setTodayRecordObject] = useState({})
  const [todayRecord, setTodayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0);
  const [today, setToday] = useState('')
  const [thisYear, setThisYear] = useState('2024')

  const [selectedType, setSelectedType] = useState('type2');

  // 기록 가능 시간 7:55 ~ 10:30
  const startTime = new Date()
  startTime.setHours(7, 40, 0, 0)
  const endTime = new Date()
  endTime.setHours(10, 30, 0, 0)
  const currentTime = new Date()

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
  setTodayRecordType1(dummy)
  const dummy2 = [
    {time: '9:17', goal: '승호', assist: '희철'},
    {time: '9:27', goal: '승호', assist: '영진'},
    {time: '9:37', goal: '승호', assist: '근한'},
    {time: '9:47', goal: '승호'},
    {time: '9:57', goal: '승호', assist: '희철'},
    {time: '10:17', goal: '승호'},
    {time: '10:27', goal: '승호', assist: '지원'},
    {time: '10:37', goal: '승호', assist: '희철'},
    {time: '10:47', goal: '승호', assist: '지원'},
    {time: '10:17', goal: '승호'},
    {time: '10:17', goal: '승호'},
    {time: '10:47', goal: '승호', assist: '지원'},
    {time: '10:57', goal: '승호', assist: '희철'},
  ]
 setTodayRecordType2(dummy2)

  // 일요일 8~10시 open
  const day = currentTime.getDay()
  if ([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime) {
    setOpen(true)
  }

  // 오늘 날짜 형식 포맷 (MMDD)
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0')
  const date = currentTime.getDate().toString().padStart(2, '0')
  const formattedDate = month + date
  setToday(formattedDate)
  setThisYear(currentTime.getFullYear().toString())

  // 실시간 데이터 가져오기
  const db = getDatabase()
  const todayRef = ref(db, thisYear + '/')
  onValue(todayRef, (snapshot) => {
    const data = snapshot.val()
    setTodayRecordObject(data)
  })

  // 디바이스에 따른 기록창 높이 세팅
  function setHeight() {
      const height = window.innerHeight - 400
      setDynamicHeight(height)
  }
  setHeight()
  window.addEventListener('resize', setHeight);

  return () => {
      window.removeEventListener('resize', setHeight);
  };
  }, []);

  // 실시간 데이터 연동
  useEffect(() => {
      const isData = Object.values(todayRecordObject)[0]
      if (isData) {
          const recordArray = Object.values(isData)
          const sortedRecordArray = recordArray.sort((a, b) => {
              const timeA = a.time.split(":").map(Number);
              const timeB = b.time.split(":").map(Number);

              if (timeA[0] !== timeB[0]) {
                  return timeA[0] - timeB[0];
              } else {
                  return timeA[1] - timeB[1];
              }
          });
          setTodayRecord(sortedRecordArray)
      }
  }, [todayRecordObject])

  const scorerHandler = (e) => {
    setScorer(e.target.value)
  }

  const assistantHandler = (e) => {
    setAssistant(e.target.value)
  }

  const registerHandler = () => {
      const db = getDatabase()
      const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')
      const id = uid()

      if (scorer.trim()) {
          set(ref(db, '2024/' + today + '/' + id), {
              time: time,
              goal: scorer.trim(),
              assist: assistant.trim(),
          });
          setScorer('')
          setAssistant('')
      }
  }

    return (
        <>
            <span className='mt-3 mb-1 underline underline-offset-1' style={{fontFamily: 'Giants-Inline'}}>{"Today's Record"}</span>
            <hr className='w-1/2 mb-5 border-indigo-600'/>
            <div className='flex flex-col items-center w-full'>
                {selectedType === 'type1' ? (
                            <>
                                <div className='w-full h-96 overflow-auto flex flex-col gap-3 items-center'>
                                    {
                                        todayRecordType1.map((record, index) =>
                                            <>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontFamily: 'Hahmlet'
                                                }}> {index + 1}R : {record.time}</span>
                                                <div key={index} className='border-amber-300 border-2 w-11/12 pl-2'>
                                                    <div className='flex mt-2 mb-3 gap-2 items-center'>
                                                        <span className='flex justify-center' style={{
                                                            width: '18%',
                                                            fontFamily: 'Giants-Inline'
                                                        }}>GOAL</span>
                                                        {record.goal.map((el, index) => <span key={index}
                                                                                              className='border-solid border-0 border-b-2 border-indigo-600'
                                                                                              style={{
                                                                                                  width: '24%',
                                                                                                  fontFamily: 'KBO-Dia-Gothic_bold'
                                                                                              }}>{el}</span>)}
                                                    </div>
                                                    <div className='flex gap-2 items-center mb-2'>
                                                        <span className='flex justify-center' style={{
                                                            width: '18%',
                                                            fontFamily: 'Giants-Inline'
                                                        }}>ASSIST</span>
                                                        {record.assist.map((el, index) => <span key={index}
                                                                                                className='border-solid border-0 border-b-2 border-indigo-600'
                                                                                                style={{
                                                                                                    width: '24%',
                                                                                                    fontFamily: 'KBO-Dia-Gothic_bold'
                                                                                                }}>{el}</span>)}
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                </div>
                                <hr className='w-full mt-5 mb-5 border-indigo-600'/>
                                {/*Write Container*/}
                                <div className=''>
                                    <span className='flex justify-center mb-3'>{round + 'R'}</span>
                                    <div className='flex mb-2 gap-2 items-center'>
                                        <span className='flex justify-center'
                                              style={{width: '18%', fontFamily: 'Giants-Inline'}}>GOAL</span>
                                        {scorer.map((el, index) => <input
                                            className='border-solid border-0 border-b-2 border-indigo-600' key={index}
                                            style={{width: '24%'}}/>)}
                                    </div>
                                    <div className='flex gap-2 items-center'>
                                        <span className='flex justify-center'
                                              style={{width: '18%', fontFamily: 'Giants-Inline'}}>ASSIST</span>
                                        {assistant.map((el, index) => <input
                                            className='border-solid border-0 border-b-2 border-indigo-600' key={index}
                                            style={{width: '24%'}}/>)}
                                    </div>
                                    <button className='mt-5'>등록</button>
                                </div>
                            </>)
                        :
                        (
                            <>
                            {/*<ProcessBorder>*/}
                            {/*<Board>*/}
                            <div className={open ? 'custom-border' : 'default-border'}>
                            <div className='w-full overflow-auto flex flex-col gap-10 items-center bg-white p-2'
                                 style={{height: dynamicHeight}}>
                                {
                                    todayRecord?.map((record, index) =>
                                        // <div className='flex items-center w-9/12 gap-5 border-b-indigo-300 border-b-2 pt-1' key={index}>
                                        <div className='flex items-center w-9/12 gap-5 pt-1 in-desktop' key={index}>
                                            <span style={{
                                                width: '30px',
                                                fontSize: '12px',
                                                fontFamily: 'Hahmlet',
                                                color: 'grey'
                                            }}>{record.time}</span>
                                            <div className='flex items-center pl-2 pr-2 border-b-indigo-300 border-b-2'>
                                                <span
                                                    className='flex justify-center relative bottom-2 mr-0.5  text-rose-600'
                                                    style={{fontFamily: 'Giants-Inline', fontSize: '13px'}}>GOAL</span>
                                                <span className='mr-5 font-bold text-black'>{record.goal}</span>
                                                {record.assist &&
                                                    <>
                                                        <span
                                                            className='flex justify-center relative bottom-2 mr-0.5 text-lime-500'
                                                            style={{
                                                                fontFamily: 'Giants-Inline',
                                                                fontSize: '13px'
                                                            }}>ASSIST</span>
                                                        <span className='font-bold text-black'>{record.assist}</span>
                                                    </>}
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                            </div>
                            {/*Write Container*/}
                            <hr className='border-1 border-indigo-600 w-4/5 mt-7 mb-4'/>
                            {open ?
                                <div className='flex items-center gap-5 mb-1'>
                                    <div>
                                        <div className='flex mb-2 gap-0.5 items-center'>
                                        <span className='flex justify-center text-rose-600'
                                              style={{width: '70px', fontFamily: 'Giants-Inline'}}>GOAL</span>
                                            <input
                                                className='w-24 border-solid border-0 border-b-2 border-indigo-600 text-center outline-none'
                                                value={scorer} onChange={scorerHandler}/>
                                        </div>
                                        <div className='flex gap-0.5 items-center'>
                                        <span className='flex justify-center text-lime-500'
                                              style={{width: '70px', fontFamily: 'Giants-Inline'}}>ASSIST</span>
                                            <input
                                                className='w-24 border-solid border-0 border-b-2 border-indigo-600 text-center outline-none'
                                                value={assistant} onChange={assistantHandler}/>
                                        </div>
                                    </div>
                                    <button className='relative bottom-2 mt-5' onClick={registerHandler}>등록</button>
                                </div>
                                :
                                <span className='mb-3'>기록 가능 시간이 아닙니다.</span>
                            }
                            {/*</Board>*/}
                        {/*</ProcessBorder>*/}
            </>
)
                }
            </div>
        </>
    )
}

export default LetsRecord

const ProcessBorder = styled.div`
    --borderWidth: 2px;
    position: relative;
    border-radius: var(--borderWidth);
    z-index: revert;
    margin-bottom: 15px;

    @media (max-width: 821px) {
        width: 100%;
        //left: 2.3%;
    }

    &::after {
        content: '';
        position: absolute;
        top: calc(-1 * var(--borderWidth));
        left: calc(-1 * var(--borderWidth));
        height: 105%;
        width: 97%;
        background: linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82);
        border-radius: calc(2 * var(--borderWidth));
        z-index: -1;
        animation: animatedgradient 3s ease alternate infinite;
        background-size: 300% 300%;
        filter: blur(5px);
        @media (max-width: 821px) {
            width: 100%;
        };
    }
`

const Board = styled`
    position: relative;
    z-index: 3;
    width: 96%;
    height: 100%;
    background: repeating-linear-gradient(to right, #666666, black 82%, #3f3f3f 18%);
`