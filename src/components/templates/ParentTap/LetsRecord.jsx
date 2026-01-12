import { useEffect, useState, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../../firebase.js'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import getRecords from '@/hooks/getRecords.js'

import DailyMVP from '@/components/organisms/DailyMVP.jsx'
import TeamScorePopup from '@/components/organisms/TeamScorePopup.jsx'
import RecordContainer from '@/components/organisms/RecordContainer.jsx'
import WriteContainer from '@/components/organisms/WriteContainer.jsx'
import SelectTeamPopup from '@/components/organisms/SelectTeamPopup.jsx'
import SelectScorerTeamPopup from '@/components/organisms/SelectScorerTeamPopup.jsx'
import FeverTimeBar from '@/components/organisms/FeverTimeBar.jsx'
import './LetsRecord.css'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, remove, set, update } from 'firebase/database'

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
  const { existingMembers, oneCharacterMembers, membersNickName } = getMembers()
  const { todaysRealtimeRecord, todaysRealtimeRound, todaysRequestList } = getRecords()
  const { open, setOpen, recordData, weeklyTeamData, headerHeight } = props
  const registerRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const feverTimeRef = useRef(null)
  const [todayRecord, setTodayRecord] = useState([])
  const [displayRecord, setDisplayRecord] = useState([])
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const [writtenData, setWrittenData] = useState(null)
  const [registerHeight, setRegisterHeight] = useState(0)
  const [feverTimeHeight, setFeverTimeHeight] = useState(0)
  const [canRegister, setCanRegister] = useState(false)
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
  const [showFeverTime, setShowFeverTime] = useState(false)
  const [isFeverTime, setIsFeverTime] = useState(false)
  const [loadingFlag, setLoadingFlag] = useState(false)
  // style class
  const tapContainerStyle = `flex flex-col items-center w-full relative ${!open ? 'justify-center h-[75vh] top-[-21px]' : 'top-2'}`
  const templateContainerStyle = 'flex flex-col items-center w-full'

  useEffect(() => {
    if (registerRef.current) {
      setRegisterHeight(registerRef.current.clientHeight)
    }
    if (thisDay !== 6) {
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
      ([0, 7].includes(thisDay) &&
      currentTime >= gameEndTime &&
      currentTime <= recordTapCloseTime)
    ) {
      setShowMVP(true)
      setShowRequestUpdateButton(true)
    }
  }, [thisDay])

  // daily 실시간 record
  useEffect(() => {
    setLoadingFlag(true)
    if (!todaysRealtimeRound) return
    if (thisDay <= 6 && thisDay >= 1) {
      setLoadingFlag(false)
    }
    const data = todaysRealtimeRound
    if (Object.keys(data).length > 0) {
      const lastRoundValue = Object.values(data)?.reduce((max, cur) =>
        cur.index > max.index ? cur : max,
      )
      if (lastRoundValue.goal && Object.keys(lastRoundValue?.goal)?.includes('fever-time-bar')) {
        setIsFeverTime(true)
      }

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
    setLoadingFlag(false)
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

  useEffect(() => {
    const openFeverTime = new Date(currentTime).setHours(9, 45, 0, 0)
    if (open && currentTime >= openFeverTime) {
      setShowFeverTime(true)
    }
  }, [open, currentTime])

  const feverTimeHandler = () => {
    Swal.fire({
      title: '피버 타임 켤까요?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Fever!',
      cancelButtonText: '취소',
    }).then(async (result) => {
      if (!result.isConfirmed) return

      const getMostFrequentElements = (arr) => {
        if (!arr) return []
        const countMap = {}

        for (const value of arr) {
          countMap[value] = (countMap[value] || 0) + 1
        }

        const maxCount = Math.max(...Object.values(countMap))

        return Object.entries(countMap)
          .filter(([_, count]) => count === maxCount)
          .map(([value]) => value)
      }

      const db = getDatabase()
      const basePath = `${thisYear}/${today}_rounds`

      // 1) 마지막 라운드 찾기
      const lastRound = await getLastRound(db, basePath)
      if (!lastRound) return

      const lastRoundRef = ref(db, `${basePath}/${lastRound.id}`)
      const lastRoundSnap = await get(lastRoundRef)
      const lastRoundValue = lastRoundSnap.val()

      if (lastRoundValue?.goal) {
        // 2-A) 골이 있는 라운드면 → 승패 여부, fever-time-bar 추가
        const mostGetGoalTeam = getMostFrequentElements(
          lastRoundValue.getGoalTeam || [],
        )
        await update(lastRoundRef, {
          winnerTeam: {
            number: mostGetGoalTeam,
            member:
              mostGetGoalTeam.length === 1
                ? weeklyTeamData.data[String(mostGetGoalTeam[0])]
                : weeklyTeamData.data[String(mostGetGoalTeam[0])].concat(weeklyTeamData.data[String(mostGetGoalTeam[1])])
          },
          lostTeam: lastRoundValue.teamList.find(
            (team) => team !== String(mostGetGoalTeam[0]),
          ),
        })
        await addFeverBarToRound(db, basePath, lastRound.id)
      } else {
        // 2-B) 골이 없는 라운드면 → 라운드 삭제 후,
        //      새로 마지막 라운드 찾아서 fever-time-bar 추가
        await remove(lastRoundRef)

        const newLastRound = await getLastRound(db, basePath)
        if (!newLastRound) return

        await addFeverBarToRound(db, basePath, newLastRound.id)
      }

      setIsFeverTime(true)
    })
  }

  /** 현재 시간 HH:mm:ss 포맷 */
  const formatCurrentTime = (currentTime) => {
    const h = currentTime.getHours().toString().padStart(2, '0')
    const m = currentTime.getMinutes().toString().padStart(2, '0')
    const s = currentTime.getSeconds().toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  /** rounds 컬렉션에서 index가 가장 큰 라운드 찾기 */
  const getLastRound = async (db, basePath) => {
    const roundRef = ref(db, basePath)
    const snap = await get(roundRef)
    const rounds = snap.val()
    if (!rounds) return null

    const lastRoundObj = Object.values(rounds).reduce((max, cur) =>
      cur.index > max.index ? cur : max,
    )

    return lastRoundObj // { id, index, ... }
  }

  /** 특정 라운드에 fever-time-bar goal 추가 */
  const addFeverBarToRound = async (db, basePath, roundId) => {
    const goalRef = ref(db, `${basePath}/${roundId}/goal/fever-time-bar`)
    const formattedTime = formatCurrentTime(currentTime)

    await set(goalRef, { id: 'fever-time-bar', time: formattedTime })
  }

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
          Object.entries(membersNickName).forEach(([nick, name]) => {
            if (nick.includes(member)) {
              stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
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
          Object.entries(membersNickName).forEach(([nick, name]) => {
            if (nick.includes(member)) {
              stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
            }
          })
        }
      })

      goalRecord.forEach((item) => {
        const { assist, goal } = item
        if (item.id === 'fever-time-bar') {
          return
        }

        if (goal !== '') {
          // 외자 골 처리
          if (goal?.length === 1) {
            oneCharacterMembers.forEach((player) => {
              if (player.includes(goal) && stats[player]) {
                stats[player]['골']++
              }
            })
            Object.entries(membersNickName).forEach(([nick, name]) => {
              if (nick.includes(goal) && stats[name]) {
                stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
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
            Object.entries(membersNickName).forEach(([nick, name]) => {
              if (nick.includes(goal) && stats[name]) {
                stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
              }
            })
          }
        }

        if (assist !== '') {
          // 외자 어시 처리
          if (assist?.length === 1) {
            oneCharacterMembers.forEach((player) => {
              if (player.includes(assist) && stats[player]) {
                stats[player]['어시']++
              }
            })
            Object.entries(membersNickName).forEach(([nick, name]) => {
              if (nick.includes(assist) && stats[name]) {
                stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
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
            Object.entries(membersNickName).forEach(([nick, name]) => {
              if (nick.includes(assist) && stats[name]) {
                stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
              }
            })
          }
        }
      })

      const formattedRoundRecord = formatRoundRecord(roundRecord)
      Object.entries(formattedRoundRecord).forEach(([key, value]) => {
        if (key?.length === 1) {
          oneCharacterMembers.forEach((player) => {
            if (player.includes(key) && stats[player]) {
              stats[player]['승점'] = value
            }
          })
          Object.entries(membersNickName).forEach(([nick, name]) => {
            if (nick.includes(key) && stats[name]) {
              stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
            }
          })
        } else {
          const others = existingMembers.filter((existing) => !oneCharacterMembers.includes(existing))
          others.forEach((player) => {
            if (player.includes(key) && stats[player]) {
              stats[player]['승점'] = value
            }
          })
          Object.entries(membersNickName).forEach(([nick, name]) => {
            if (nick.includes(key) && stats[name]) {
              stats[name] = { 출석: 1, 골: 0, 어시: 0, 승점: 0 }
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
  const stats = formatRecordByName(todayRecord, displayRecord)

  useEffect(() => {
    if (stats && Object.keys(stats).length > 0 && todayRecord && canRegister) {
      const registerRecord = async () => {
        // const docRef = doc(db, thisYear, today)
        const docRef = doc(db, thisYear, today)
        await setDoc(docRef, stats)
        console.log('Document written with ID: ', docRef.id)
        setWrittenData(stats)
        // 스크롤 맨 밑으로
        const scrollContainer = scrollContainerRef.current
        if (scrollContainer) {
          const scrollHeight = scrollContainer.scrollHeight
          scrollContainer.scrollTo({
            top: scrollHeight,
            behavior: 'smooth',
          })
        }
      }
      if (!writtenData) {
        registerRecord()
      }
      if (writtenData && !compareObjects(stats, writtenData)) {
        registerRecord()
      }
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
        window.innerHeight -
        (headerHeight + registerHeight + feverTimeHeight + additionalHeight)
      setDynamicHeight(height)
    }
    setHeight()
  }, [requestUpdateMode, registerHeight, feverTimeHeight])

  useEffect(() => {
    if (feverTimeRef.current) {
      setFeverTimeHeight(feverTimeRef.current.clientHeight)
    } else {
      setFeverTimeHeight(0)
    }
  }, [feverTimeRef?.current?.clientHeight, showFeverTime, isFeverTime])

  return (
    <div className={tapContainerStyle}>
      {loadingFlag && (
        <div className="fixed z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          <div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />
        </div>
      )}
      {/*<TapTitleText active={open} title={"Today's Record"} />*/}
      {/*{!showRequestUpdateButton && <Separator fullWidth={false} />}*/}
      <div className={templateContainerStyle}>
        <>
          {showMVP && (
            <div className={'absolute z-10 flex flex-col items-center top-[10%] w-[90%]'}>
              <DailyMVP
                setShowMVP={setShowMVP}
                recordData={recordData}
                year={thisYear}
                today={today}
              />
              <TeamScorePopup
                setShowMVP={setShowMVP}
                recordData={displayRecord}
                weeklyTeamData={weeklyTeamData}
              />
            </div>
          )}
          <RecordContainer
            open={open}
            showMVP={showMVP}
            lastRecord={lastRecord}
            isFeverTime={isFeverTime}
            canRegister={canRegister}
            setPopupType={setPopupType}
            playingTeams={playingTeams}
            dynamicHeight={dynamicHeight}
            displayRecord={displayRecord}
            weeklyTeamData={weeklyTeamData}
            scrollContainerRef={scrollContainerRef}
            setPlayingTeams={setPlayingTeams}
            setPendingRoundId={setPendingRoundId}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
          />
          {canRegister && showFeverTime && !isFeverTime && (
            <div className="mt-2 w-[80%] z-4" ref={feverTimeRef}>
              <FeverTimeBar
                isFeverTime={isFeverTime}
                clickHandler={feverTimeHandler}
              />
            </div>
          )}
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
