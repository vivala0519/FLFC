import { useEffect, useState, useRef, useMemo } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'

import TapTitleText from '@/components/atoms/Text/TapTitleText.jsx'
import Separator from '@/components/atoms/Separator.jsx'
import DailyMVP from '@/components/organisms/DailyMVP.jsx'
import RecordContainer from '@/components/organisms/RecordContainer.jsx'
import WriteContainer from '@/components/organisms/WriteContainer.jsx'
import './LetsRecord.css'

const LetsRecord = (props) => {
  const {
    time: {
      today,
      thisDay,
      thisYear,
      currentTime,
      gameEndTime,
      gameStartTime,
      recordTapCloseTime,
    },
  } = getTimes()
  const { existingMembers, oneCharacterMembers } = getMembers()
  const { todaysRealtimeRecord, todaysRequestList } = getRecords()
  const { open, setOpen, recordData, weeklyTeamData, headerHeight } = props
  const registerRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [todayRecord, setTodayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0)
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

  useEffect(() => {
    if (registerRef.current) {
      setRegisterHeight(registerRef.current.clientHeight)
    }
    if (
      [0, 7].includes(thisDay) &&
      currentTime >= gameStartTime &&
      currentTime <= recordTapCloseTime
    ) {
      setOpen(true)
    }
    if (
      [0, 7].includes(thisDay) &&
      currentTime >= gameStartTime &&
      currentTime <= gameEndTime
    ) {
      setCanRegister(true)
    }
    if (
      [0, 7].includes(thisDay) &&
      currentTime >= gameEndTime &&
      currentTime <= recordTapCloseTime
    ) {
      setShowMVP(true)
      setShowRequestUpdateButton(true)
    }
  }, [])

  // daily 실시간 record
  useEffect(() => {
    const isData = todaysRealtimeRecord
    if (isData) {
      const recordArray = Object.values(isData)
      const sortedRecordArray = recordArray.sort((a, b) => {
        const timeA = parseTimeFromString(a.time)
        const timeB = parseTimeFromString(b.time)

        return timeA - timeB
      })
      setTodayRecord(sortedRecordArray)
    }
  }, [todaysRealtimeRecord])

  // request list
  useEffect(() => {
    if (requestList) {
      const requestList = Object.values(todaysRequestList)
      const sortedRequestArray = requestList.sort((a, b) => {
        const timeA = parseTimeFromString(a.time)
        const timeB = parseTimeFromString(b.time)

        return timeA - timeB
      })
      setRequestList(sortedRequestArray)
    }
  }, [todaysRequestList])

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
    const data = recordData?.find((obj) => obj.id === today)
    if (data?.data) {
      setWrittenData(data.data)
    }
  }, [recordData])

  const parseTimeFromString = (record) => {
    const [hours, minutes, seconds] = record.split(':')
    return new Date(0, 0, 0, hours, minutes, seconds)
  }

  const formatRecordByName = (record) => {
    const stats = {}
    if (
      weeklyTeamData?.data &&
      weeklyTeamData?.id === thisYear.slice(2, 4) + today
    ) {
      const data = weeklyTeamData.data
      const thisWeekMembers = data[1].concat(data[2], data[3])
      thisWeekMembers.forEach((member) => {
        // 외자 출석처리
        if (member.length === 1) {
          oneCharacterMembers.forEach((player) => {
            if (player.includes(member)) {
              stats[player] = { 출석: 1, 골: 0, 어시: 0 }
            }
          })
        } else {
          // 나머지 출석처리
          const others = existingMembers.filter(
            (existing) => !oneCharacterMembers.includes(existing),
          )
          others.forEach((player) => {
            if (member && player.includes(member)) {
              stats[player] = { 출석: 1, 골: 0, 어시: 0 }
            }
          })
        }
      })

      record.forEach((item) => {
        const { assist, goal } = item

        if (goal !== '') {
          // 외자 골 처리
          if (goal.length === 1) {
            oneCharacterMembers.forEach((player) => {
              if (player.includes(goal) && stats[player]) {
                stats[player]['골']++
              }
            })
          } else {
            // 나머지 골 처리
            const others = existingMembers.filter(
              (existing) => !oneCharacterMembers.includes(existing),
            )
            others.forEach((player) => {
              if (player.includes(goal) && stats[player]) {
                stats[player]['골']++
              }
            })
          }
        }

        if (assist !== '') {
          // 외자 어시 처리
          if (assist.length === 1) {
            oneCharacterMembers.forEach((player) => {
              if (player.includes(assist) && stats[player]) {
                stats[player]['어시']++
              }
            })
          } else {
            // 나머지 어시 처리
            const others = existingMembers.filter(
              (existing) => !oneCharacterMembers.includes(existing),
            )
            others.forEach((player) => {
              if (player.includes(assist) && stats[player]) {
                stats[player]['어시']++
              }
            })
          }
        }
      })
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
      if (
        objA[key]['출석'] !== objB[key]['출석'] ||
        objA[key]['골'] !== objB[key]['골'] ||
        objA[key]['어시'] !== objB[key]['어시']
      ) {
        return false
      }
    }
    return true
  }

  // Firestore 데이터 등록
  const stats = useMemo(() => formatRecordByName(todayRecord), [todayRecord])
  useEffect(() => {
    if (stats && canRegister) {
      const registerRecord = async () => {
        const docRef = doc(db, thisYear, today)
        await setDoc(docRef, stats)
        console.log('Document written with ID: ', docRef.id)
      }
      if (!compareObjects(stats, writtenData)) {
        registerRecord()
      }
    }
    // 스크롤 맨 밑으로
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight
      scrollContainer.scrollTo({
        top: scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [todayRecord, stats, existingMembers])

  // MVP 화면 닫으면 컨페티 종료
  useEffect(() => {
    if (!showMVP) {
      const canvasElements = document.getElementsByTagName('canvas')
      while (canvasElements.length > 0) {
        canvasElements[0].parentNode.removeChild(canvasElements[0])
      }
    }
  }, [showMVP])

  useEffect(() => {
    function setHeight() {
      const additionalHeight = requestUpdateMode ? 300 : 200
      const height =
        window.innerHeight - (headerHeight + registerHeight + additionalHeight)
      setDynamicHeight(height)
    }
    setHeight()
  }, [requestUpdateMode])

  return (
    <div className={tapContainerStyle}>
      <TapTitleText active={open} title={"Today's Record"} />
      {!showRequestUpdateButton && <Separator fullWidth={false} />}
      <div className={templateContainerStyle}>
        <>
          {showMVP && (
            <DailyMVP
              setShowMVP={setShowMVP}
              recordData={recordData}
              year={thisYear}
              today={today}
            />
          )}
          <RecordContainer
            open={open}
            scrollContainerRef={scrollContainerRef}
            dynamicHeight={dynamicHeight}
            showMVP={showMVP}
            todayRecord={todayRecord}
            lastRecord={lastRecord}
            canRegister={canRegister}
          />
          <WriteContainer
            open={open}
            scrollContainerRef={scrollContainerRef}
            registerRef={registerRef}
            canRegister={canRegister}
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
