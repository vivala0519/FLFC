import {useEffect, useState, useRef} from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import {doc, setDoc} from 'firebase/firestore'
import {db} from '../../../../firebase.js'
import { useAtom } from "jotai"
import getTimes from '@/hooks/getTimes.js'
import TapTitleText from '@/components/atoms/Text/TapTitleText.jsx'
import Separator from '@/components/atoms/Separator.jsx'
import DailyMVP from '@/components/organisms/DailyMVP.jsx'
import RecordContainer from '@/components/organisms/RecordContainer.jsx'
import WriteContainer from '@/components/organisms/WriteContainer.jsx'
import './LetsRecord.css'

const LetsRecord = (props) => {
  const { today, thisYear } = getTimes()
  const { open, setOpen, recordData, weeklyTeamData, headerHeight } = props
  const registerRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [todayRecordObject, setTodayRecordObject] = useState({})
  const [todayRecord, setTodayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const players = ['이승호', '임준휘', '우장식', '이원효', '김동휘', '임희재', '김규진', '임건휘', '한상태', '노태훈', '박근한', '윤희철', '정우진', '홍원진', '김남구', '김민관', '양대열', '윤영진', '임종우', '황정민', '손지원', '방승진', '전희종', '황철민', '선민조', '최봉호', '최수혁', '김대건', '김동주', '김병일', '김성록', '박남호', '선우용', '윤준석', '이재진', '이진헌', '장성민', '전의준', '진장용', '하민수', '황은집']
  const [writtenData, setWrittenData] = useState([])
  const [registerHeight, setRegisterHeight] = useState(0)
  const [canRegister, setCanRegister] = useState(false)
  const [lastRecord, setLastRecord] = useState('')
  const [showMVP, setShowMVP] = useState(false)
  const [showRequestUpdateButton, setShowRequestUpdateButton] = useState(false)
  const [requestUpdateMode, setRequestUpdateMode] = useState(false)
  const [requestList, setRequestList] = useState([])
  // style class
  const tapContainerStyle = `flex flex-col items-center w-full relative ${!open ? 'justify-center h-[75vh] top-[-21px]' : 'top-[-12px]'}`
  const templateContainerStyle = 'flex flex-col items-center w-full'

  // 기록 가능 시간 7:50 ~ 10:05
  const startTime = new Date()
  startTime.setHours(7, 50, 0, 0)
  const endTime = new Date()
  endTime.setHours(23, 59, 0, 0)
  const currentTime = new Date()

  const registerEndTime = new Date()
  registerEndTime.setHours(10, 5, 0, 0)

  const showMVPStartTime = new Date()
  showMVPStartTime.setHours(10, 5, 0, 0)

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
    if ([0, 7].includes(day) && currentTime >= showMVPStartTime && currentTime <= endTime) {
      setShowMVP(true)
      setShowRequestUpdateButton(true)
    }

    // 실시간 데이터 가져오기
    const db = getDatabase()
    const todayRef = ref(db, thisYear + '/')
    onValue(todayRef, (snapshot) => {
      const data = snapshot.val()
      setTodayRecordObject(data)
    })

  }, [])

  useEffect(() => {
    function setHeight() {
      const height = window.innerHeight - (headerHeight + registerHeight + 200)
      setDynamicHeight(height)
    }
    setHeight()
    window.addEventListener('resize', setHeight)

    return () => {
      window.removeEventListener('resize', setHeight)
    }
  }, [headerHeight, registerHeight])

  // 오늘의 기록된 데이터 가져오기
  useEffect(() => {
    const data = recordData?.find(obj => obj.id === today)
    if (data?.data) {
      setWrittenData(data.data)
    }
  }, [recordData])

  const parseTimeFromString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  // 실시간 데이터 연동
  useEffect(() => {
    // today's record
    const isData = todayRecordObject[today]
    if (isData) {
      const recordArray = Object.values(isData)
      const sortedRecordArray = recordArray.sort((a, b) => {
        const timeA = parseTimeFromString(a.time)
        const timeB = parseTimeFromString(b.time)

        return timeA - timeB
      })
      setTodayRecord(sortedRecordArray)
    }
    // request update list
    const isRequestList = todayRecordObject[today + '_request']
    if (isRequestList) {
      const requestList = Object.values(isRequestList)
      const sortedRequestArray = requestList.sort((a, b) => {
        const timeA = parseTimeFromString(a.time)
        const timeB = parseTimeFromString(b.time)

        return timeA - timeB
      })
      setRequestList(sortedRequestArray)
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
        const docRef = doc(db, thisYear, today)
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

  // MVP 화면 닫으면 퍼레이드 종료
  useEffect(() => {
    if (!showMVP) {
      const canvasElements = document.getElementsByTagName('canvas')
      while (canvasElements.length > 0) {
        canvasElements[0].parentNode.removeChild(canvasElements[0])
      }
    }
  }, [showMVP]);

  useEffect(() => {
    function setHeight() {
      const additionalHeight = requestUpdateMode ? 300 : 200
      const height = window.innerHeight - (headerHeight + registerHeight + additionalHeight)
      setDynamicHeight(height)
    }
    setHeight()
  }, [requestUpdateMode])

  return (
    <div
      className={tapContainerStyle}>
      <TapTitleText active={open} title={"Today's Record"} />
        <Separator fullWidth={false} />
        <div className={templateContainerStyle}>
          <>
            {showMVP && <DailyMVP setShowMVP={setShowMVP} recordData={recordData} year={thisYear} today={today} />}
            <RecordContainer
              scrollContainerRef={scrollContainerRef}
              open={open}
              dynamicHeight={dynamicHeight}
              showMVP={showMVP}
              todayRecord={todayRecord}
              lastRecord={lastRecord}
              canRegister={canRegister}
              thisYear={thisYear}
              today={today}
            />
            <WriteContainer
              open={open}
              scrollContainerRef={scrollContainerRef}
              registerRef={registerRef}
              canRegister={canRegister}
              thisYear={thisYear}
              today={today}
              currentTime={currentTime}
              startTime={startTime}
              endTime={endTime}
              setLastRecord={setLastRecord}
              requestUpdateMode={requestUpdateMode}
              setRequestUpdateMode={setRequestUpdateMode}
              requestList={requestList}
              showRequestUpdateButton={showRequestUpdateButton}
            />
          </>
        </div>
    </div>
  )
}

export default LetsRecord