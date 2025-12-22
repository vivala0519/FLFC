import { useEffect, useState, useRef, useMemo } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'

import DailyMVP from '@/components/organisms/DailyMVP.jsx'
import RecordContainer from '@/components/organisms/RecordContainer.jsx'
import WriteContainer from '@/components/organisms/WriteContainer.jsx'
import SelectTeamPopup from '@/components/organisms/SelectTeamPopup.jsx'
import SelectScorerTeamPopup from '@/components/organisms/SelectScorerTeamPopup.jsx'
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
  const { todaysRealtimeRecord, todaysRealtimeRound, todaysRequestList } = getRecords()
  const { open, setOpen, recordData, weeklyTeamData, headerHeight } = props
  const registerRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [todayRecord, setTodayRecord] = useState([])
  const [displayRecord, setDisplayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const [writtenData, setWrittenData] = useState({})
  const [registerHeight, setRegisterHeight] = useState(0)
  const [canRegister, setCanRegister] = useState(true)
  const [lastRecord, setLastRecord] = useState('')
  const [showMVP, setShowMVP] = useState(false)
  const [requestUpdateMode, setRequestUpdateMode] = useState(false)
  const [requestList, setRequestList] = useState([])
  const [playingTeams, setPlayingTeams] = useState(new Set())
  const [scorerTeam, setScorerTeam] = useState(null)
  const [popupType, setPopupType] = useState('')
  const [pendingRoundId, setPendingRoundId] = useState(null)
  const [showSelectTeamPopup, setShowSelectTeamPopup] = useState(false)
  const [selectTeamPopupMessage, setSelectTeamPopupMessage] = useState('')
  const [handleRoundWinnerTrigger, setHandleRoundWinnerTrigger] = useState(null)
  const [selectScorerTeamPopupMessage, setSelectScorerTeamPopupMessage] = useState('')
  const [showSelectScorerTeamPopup, setShowSelectScorerTeamPopup] = useState(false)
  const [showRequestUpdateButton, setShowRequestUpdateButton] = useState(false)
  // style class
  const tapContainerStyle = `flex flex-col items-center w-full relative ${!open ? 'justify-center h-[75vh] top-[-21px]' : 'top-2'}`
  const templateContainerStyle = 'flex flex-col items-center w-full'

  useEffect(() => {
    if (registerRef.current) {
      setRegisterHeight(registerRef.current.clientHeight)
    }
    if (
      ![0, 7].includes(thisDay) &&
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
      !([0, 7].includes(thisDay) &&
      currentTime >= gameEndTime &&
      currentTime <= recordTapCloseTime)
    ) {
      setShowMVP(true)
      setShowRequestUpdateButton(true)
    }
  }, [])

  // daily 실시간 record
  useEffect(() => {
    const data = todaysRealtimeRound
    if (data) {
      // firestore에 등록하기 위한 전체 골 data
      const goalRecord = Object.values(data || {}).flatMap(round => {
        if (!round.goal) return []

        return Object.values(round.goal).map(goal => ({
          ...goal,
        })).sort((a, b) => parseTimeFromString(a.time) - parseTimeFromString(b.time))
      })
      // display 위한 라운드/골 데이터
      const roundRecord = Object.entries(data || {})
        .map(([roundId, round]) => ({
          ...round,
          roundId,
          goals: round.goal ? Object.values(round.goal).sort((a, b) => parseTimeFromString(a.time) - parseTimeFromString(b.time)) : []
        }))
        .sort((a, b) => a.index - b.index)
      setTodayRecord(goalRecord)
      setDisplayRecord(roundRecord)
    }
  }, [todaysRealtimeRecord, todaysRealtimeRound])

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
      const height = window.innerHeight - (headerHeight + registerHeight + 150)
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

  const formatRecordByName = (goalRecord, roundRecord) => {
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
              stats[player] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
            }
          })
        } else {
          // 나머지 출석처리
          const others = existingMembers.filter(
            (existing) => !oneCharacterMembers.includes(existing),
          )
          others.forEach((player) => {
            if (member && player.includes(member)) {
              stats[player] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
            }
          })
        }
      })

      goalRecord.forEach((item) => {
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

      const formattedRoundRecord = formatRoundRecord(roundRecord)
      Object.entries(formattedRoundRecord).forEach(([key, value]) => {
        if (key.length === 1) {
          oneCharacterMembers.forEach((player) => {
            if (player.includes(key) && stats[player]) {
              stats[player]['승점'] = value
            }
          })
        } else {
          const others = existingMembers.filter((existing) => !oneCharacterMembers.includes(existing))
          others.forEach((player) => {
            if (player.includes(key) && stats[player]) {
              stats[player]['승점'] = value
            }
          })
        }
      })
      return stats
    }
  }

  const formatRoundRecord = (records) => {
    return records.reduce((acc, rec) => {
      const winnerTeam = rec.winnerTeam

      if (
        !winnerTeam ||
        !Array.isArray(winnerTeam.member) ||
        !Array.isArray(winnerTeam.number)
      ) {
        return acc
      }

      const len = winnerTeam.number.length
      const scorePerMember =
        len === 2 ? 1 :
          len === 1 ? 3 :
            0

      if (scorePerMember === 0) return acc

      // 한 라운드 안에서 중복 제거
      const uniqueMembers = [...new Set(winnerTeam.member)]

      uniqueMembers.forEach((name) => {
        acc[name] = (acc[name] || 0) + scorePerMember
      })

      return acc
    }, {})
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
        objA[key]['어시'] !== objB[key]['어시'] ||
        objA[key]['승점'] !== objB[key]['승점']
      ) {
        return false
      }
    }
    return true
  }

  // Firestore 데이터 등록
  const stats = useMemo(() => formatRecordByName(todayRecord, displayRecord), [todayRecord])

  useEffect(() => {
    if (stats) {
    // if (stats && canRegister) {
      const registerRecord = async () => {
        // const docRef = doc(db, thisYear, today)
        const docRef = doc(db, thisYear + '_dev', today)
        await setDoc(docRef, stats)
        console.log('Document written with ID: ', docRef.id)
        setWrittenData(stats)
      }
      if ((!compareObjects(stats, writtenData) && Object.keys(writtenData).length !== 0) || !writtenData) {
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
      {/*<TapTitleText active={open} title={"Today's Record"} />*/}
      {/*{!showRequestUpdateButton && <Separator fullWidth={false} />}*/}
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
            showMVP={showMVP}
            lastRecord={lastRecord}
            canRegister={canRegister}
            playingTeams={playingTeams}
            dynamicHeight={dynamicHeight}
            displayRecord={displayRecord}
            weeklyTeamData={weeklyTeamData}
            scrollContainerRef={scrollContainerRef}
            setPendingRoundId={setPendingRoundId}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
          />
          <WriteContainer
            open={open}
            popupType={popupType}
            scorerTeam={scorerTeam}
            requestList={requestList}
            registerRef={registerRef}
            canRegister={canRegister}
            playingTeams={playingTeams}
            weeklyTeamData={weeklyTeamData}
            pendingRoundId={pendingRoundId}
            requestUpdateMode={requestUpdateMode}
            scrollContainerRef={scrollContainerRef}
            showSelectTeamPopup={showSelectTeamPopup}
            handleRoundWinnerTrigger={handleRoundWinnerTrigger}
            showSelectScorerTeamPopup={showSelectScorerTeamPopup}
            showRequestUpdateButton={showRequestUpdateButton}
            setPopupType={setPopupType}
            setLastRecord={setLastRecord}
            setScorerTeam={setScorerTeam}
            setPlayingTeams={setPlayingTeams}
            setPendingRoundId={setPendingRoundId}
            setRequestUpdateMode={setRequestUpdateMode}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
            setHandleRoundWinnerTrigger={setHandleRoundWinnerTrigger}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
          />
        </>
      </div>
      {showSelectTeamPopup && (
        <SelectTeamPopup
          playingTeams={playingTeams}
          weeklyTeamData={weeklyTeamData}
          setPopupType={setPopupType}
          selectTeamPopupMessage={selectTeamPopupMessage}
          setPlayingTeams={setPlayingTeams}
          setShowSelectTeamPopup={setShowSelectTeamPopup}
        />
      )}
      {showSelectScorerTeamPopup && (
        <SelectScorerTeamPopup
          scorerTeam={scorerTeam}
          playingTeams={playingTeams}
          weeklyTeamData={weeklyTeamData}
          setHandleRoundWinnerTrigger={setHandleRoundWinnerTrigger}
          selectScorerTeamPopupMessage={selectScorerTeamPopupMessage}
          setScorerTeam={setScorerTeam}
          setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
        />
      )}
    </div>
  )
}

export default LetsRecord
