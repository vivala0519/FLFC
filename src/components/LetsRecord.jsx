import {useEffect, useState, useRef} from 'react'
import { getDatabase, ref, get, set, child, onValue, remove } from 'firebase/database'
import { uid } from "uid"
import {doc, setDoc} from "firebase/firestore";
import {db} from "../../firebase.js";
import Swal from "sweetalert2"
import styled from 'styled-components'
import write from "@/assets/write.png"
import './LetsRecord.css'

const LetsRecord = (props) => {
  const registerRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const {open, setOpen, recordData, weeklyTeamData, headerHeight, setTap} = props
  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  const [todayRecordObject, setTodayRecordObject] = useState({})
  const [todayRecord, setTodayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0);
  const [today, setToday] = useState('')
  const [thisYear, setThisYear] = useState('2024')
  const players = ['이승호', '임준휘', '우장식', '이원효', '김동휘', '임희재', '김규진', '임건휘', '한상태', '노태훈', '박근한', '윤희철', '정우진', '홍원진', '김남구', '김민관', '양대열', '윤영진', '임종우', '황정민', '손지원', '방승진', '전희종', '황철민', '선민조', '최봉호', '최수혁', '김대건', '김동주', '김병일', '김성록', '박남호', '선우용', '안용현', '윤준석', '이재진', '이진헌', '장성민', '전의준', '진장용', '하민수', '황은집']
  const [writtenData, setWrittenData] = useState([])
  const [registerHeight, setRegisterHeight] = useState(0);
  const [canRegister, setCanRegister] = useState(false)
  const [lastRecord, setLastRecord] = useState('')

  // 기록 가능 시간 7:50 ~ 10:05
  const startTime = new Date()
  startTime.setHours(7, 50, 0, 0)
  const endTime = new Date()
  endTime.setHours(23, 59, 0, 0)
  const currentTime = new Date()

  const registerEndTime = new Date()
  registerEndTime.setHours(10, 5, 0, 0)

  useEffect(() => {
    if (registerRef.current) {
      setRegisterHeight(registerRef.current.clientHeight)
    }
    // 일요일 8~10시 open
    const day = currentTime.getDay()
    if ([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime) {
      setOpen(true)
    }
    if ([0, 7].includes(day) && currentTime >= startTime && currentTime <= registerEndTime) {
      setCanRegister(true)
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

  }, []);

  useEffect(() => {
    function setHeight() {
      const height = window.innerHeight - (headerHeight + registerHeight + 200)
      setDynamicHeight(height)
    }
    setHeight()
    window.addEventListener('resize', setHeight);

    return () => {
        window.removeEventListener('resize', setHeight);
    };
  }, [headerHeight, registerHeight]);

  // 오늘의 기록된 데이터 가져오기
  useEffect(() => {
      const data = recordData?.find(obj => obj.id === today)
      if (data?.data) {
          setWrittenData(data.data)
      }
  }, [recordData])

  const parseTimeString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  // 실시간 데이터 연동
  useEffect(() => {
      const isData = todayRecordObject[today]
      if (isData) {
        const recordArray = Object.values(isData)
        const sortedRecordArray = recordArray.sort((a, b) => {
          const timeA = parseTimeString(a.time)
          const timeB = parseTimeString(b.time)

          return timeA - timeB
        });
        setTodayRecord(sortedRecordArray)
      }
  }, [todayRecordObject])

    const formatRecordByName = (record) => {
        const stats = {}
        if (weeklyTeamData?.data && weeklyTeamData?.id === today) {
            const data = weeklyTeamData.data
            const thisWeekMembers = data[1].concat(data[2], data[3])
            thisWeekMembers.forEach(member => {
                players.forEach(player => {
                    if (member && player.includes(member)) {
                        stats[player] = {'출석': true, '골': 0, '어시': 0}
                    }
                })
            })

            record.forEach(item => {
                const { assist, goal } = item

                if (goal !== "") {
                    players.forEach(player => {
                        if (player.includes(goal) && stats[player]) {
                            stats[player]['골']++
                        }
                    })
                }

                if (assist !== "") {
                    players.forEach(player => {
                        if (player.includes(assist) && stats[player]) {
                            stats[player]['어시']++
                        }
                    })
                }
            });
            return stats
        }
    }

    function compareObjects(objA, objB) {
        const keysA = Object.keys(objA)
        const keysB = Object.keys(objB)

        if (keysA.length !== keysB.length) {
            return false
        }
        for (let key of keysA) {
            if (objA[key]['출석'] !== objB[key]['출석'] ||
                objA[key]['골'] !== objB[key]['골'] ||
                objA[key]['어시'] !== objB[key]['어시']) {
                return false
            }
        }
        return true
    }
    // Firestore 데이터 등록
    useEffect(() => {
        const stats = formatRecordByName(todayRecord)
        if (stats) {
            const registerRecord = async () => {
                const docRef = doc(db, '2024', today)
                await setDoc(docRef, stats)
                console.log("Document written with ID: ", docRef.id);
            }
            if (!compareObjects(stats, writtenData) && canRegister) {
                registerRecord()
            }
        }
        // 스크롤 맨 밑으로
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const scrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTo({
                top: scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [todayRecord])

  const scorerHandler = (e) => {
    setScorer(e.target.value)
  }

  const assistantHandler = (e) => {
    setAssistant(e.target.value)
  }

  // RealTime Database 등록
  const registerHandler = () => {
    const day = currentTime.getDay()
    if (!([0, 7].includes(day) && currentTime >= startTime && currentTime <= endTime)) {
      Swal.fire({
        icon: 'error',
        text: '기록 가능 시간이 아닙니다.'
        })
    } else {
      const db = getDatabase()
      const time = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0') + ':' + currentTime.getSeconds().toString().padStart(2, '0')
      const id = uid()

      if (scorer.trim()) {
        const record = {
          id: id,
          time: time,
          goal: scorer.trim(),
          assist: assistant.trim()
        }
        set(ref(db, '2024/' + today + '/' + id), record);
        set(ref(db, '2024/' + today + '_backup' + '/' + id), record);
        setLastRecord(id)
        setScorer('')
        setAssistant('')
      }

      // 스크롤 내려주기
      const scrollToElement = () => {
        const scrollContainer = scrollContainerRef.current;

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollContainer.clientHeight,
            behavior: 'smooth',
          });
        }
      }
      setTimeout(() => {
        scrollToElement()
      }, 300)
    }
  }

  const deleteRecord = (index) => {
      Swal.fire({
            title: '삭제, Really?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                const db = getDatabase()
                const recordRef = ref(db, '2024/' + today + '/' + todayRecord[index].id)
                remove(ref(db, '2024/' + today + '/' + todayRecord[index].id))
                remove(recordRef).then(() => {
                    console.log('Document successfully deleted!')
                })
                .catch((error) => {
                    console.log(error)
                });
            }
      })
  }

    // const showLastRecord = () => {
    //     console.log('click')
    // }

  // 슬라이드 시 탭 이동
  const [startX, setStartX] = useState(null);
  const [moveX, setMoveX] = useState(null);

  const handleTouchStart = (e) => {
      setStartX(e.touches[0].clientX);
      setMoveX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
      setMoveX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
      const diff = startX - moveX;
      if (diff > 75) {
          setTap(1)
      } else if (diff < -75) {
          setTap(3)
      }
      setStartX(null);
      setMoveX(null);
  };
      }

    return (
        <div
            className={`flex flex-col items-center w-full relative ${!open && 'justify-center'}`}
            style={{top: open ? '-12px' : '-21px', height: !open && '75vh'}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {/*<span className='text-xs absolute left-0 top-0 mt-5 cursor-pointer' onClick={showLastRecord}>{'< 지난 기록 보기'}</span>*/}
            <span className='mt-3 mb-1 underline underline-offset-1' style={{fontFamily: 'DNFForgedBlade'}}>{"Today's Record"}</span>
            <hr className='w-1/2 mb-5 border-green-700'/>
            <div className='flex flex-col items-center w-full'>
                <>
                <div className={canRegister ? 'custom-record-border' : open ? 'default-border' : 'none-border'}>
                <div ref={scrollContainerRef} className='w-full overflow-auto flex flex-col gap-10 items-center bg-white p-2'
                     style={{height: open && dynamicHeight, display: open ? 'flex' : 'none'}}>
                    {
                        todayRecord?.map((record, index) =>
                            <div className={`relative flex items-center gap-5 pt-1 in-desktop ${record.id === lastRecord ? 'bg-effect' : ''}`} key={index} style={{width: '80%'}}>
                                <span style={{
                                    width: '30px',
                                    fontSize: '12px',
                                    fontFamily: 'Hahmlet',
                                    color: 'grey'
                                }}>{record.time.split(':')[0] + ':' + record.time.split(':')[1]}</span>
                                <div className='flex items-center pl-2 pr-2 border-b-green-600 border-b-2'>
                                    <span
                                        className='flex justify-center relative bottom-2 mr-0.5'
                                        style={{fontFamily: 'Giants-Inline', fontSize: '13px', color: '#bb2649'}}>GOAL</span>
                                    <span className='mr-5 font-bold text-black'>{record.goal}</span>
                                    {record.assist &&
                                        <>
                                            <span
                                                className='flex justify-center relative bottom-2 mr-0.5'
                                                style={{
                                                    fontFamily: 'Giants-Inline',
                                                    fontSize: '13px',
                                                    color: '#eab308'
                                                }}>ASSIST</span>
                                            <span className='font-bold text-black'>{record.assist}</span>
                                        </>}
                                </div>
                                {canRegister && <div className='absolute -right-1 top-1 cursor-pointer text-red-600' onClick={() => deleteRecord(index)}>X</div>}
                            </div>
                        )
                    }
                </div>
                </div>
                {/*Write Container*/}
                <div>
                  <hr className={canRegister ? 'border-1 border-green-600 w-full mb-4' : 'hidden'}/>
                  {canRegister ?
                      <div ref={registerRef} className='flex items-center gap-5 mb-1'>
                        <div>
                          <div className='flex mb-2 gap-0.5 items-center'>
                              <span className='flex justify-center'
                                    style={{width: '70px', fontFamily: 'Giants-Inline', color: '#bb2649'}}>GOAL</span>
                            <input
                                className='w-24 border-solid border-0 border-b-2 border-green-600 text-center outline-none'
                                value={scorer} onChange={scorerHandler}/>
                          </div>
                          <div className='flex gap-0.5 items-center'>
                              <span className='flex justify-center'
                                    style={{width: '70px', fontFamily: 'Giants-Inline',  color: '#eab308'}}>ASSIST</span>
                            <input
                                className='w-24 border-solid border-0 border-b-2 border-green-600 text-center outline-none'
                                value={assistant} onChange={assistantHandler}/>
                          </div>
                        </div>
                        <button className='flex relative bottom-2 mt-5 underline-border bg-gray-50' onClick={registerHandler}>
                          <span className='text-black'>등록</span><Write/></button>
                      </div>
                    :
                      <div className={open ? 'relative bottom-4 top-10' : 'relative bottom-4'}>
                          <p className='mb-1' style={{fontFamily: 'DNFForgedBlade'}}>기록 가능 시간이 아닙니다.</p>
                          <p className='text-xs text-gray-400' style={{fontFamily: 'DNFForgedBlade'}}>Open : 07:50 ~ 10:05 Sun.</p>
                          {open && <p className='text-xs text-gray-400' style={{fontFamily: 'DNFForgedBlade'}}>기록은 오늘 하루 동안 유지됩니다.</p>}
                      </div>
                  }
                </div>
                </>
            </div>
        </div>
    )
}

export default LetsRecord

const Write = styled.div`
    background: url(${write}) no-repeat center center;
    background-size: 100% 100%;
    width: 20px;
    height: 20px;
    position: relative;
    top: 3px;
    left: 7px;
`