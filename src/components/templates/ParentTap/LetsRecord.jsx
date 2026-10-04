import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
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
import ParticleFootballLoader from '@/components/atoms/ParticleFootballLoader.jsx'
import './LetsRecord.css'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, remove, set, update } from 'firebase/database'
import { getRoundParticipants } from '@/apis/roundParticipants.js'
import { createRecordMemberResolver } from '@/apis/recordMembers.js'
import { formatDailyRecordStats } from '@/apis/formatDailyRecordStats.js'

const LetsRecord = (props) => {
  const { time: { today, thisDay, thisYear, currentTime, gameEndTime, gameStartTime, recordTapCloseTime } } = getTimes()
  const { existingMembers, oneCharacterMembers, membersNickName } = getMembers()
  const { totalWeeklyTeamData, firestoreRecord, todaysRealtimeRound, todaysRequestList } = getRecords()
  const { open, setOpen, headerHeight } = props
  const writeContainerRef = useRef(null)
  const recordBurstTargetRef = useRef(null)
  const recordBurstControllerRef = useRef(null)
  const prepareRecordBurst = useCallback(() => {
    recordBurstControllerRef.current?.scrollToLatest()
  }, [])
  const feverTimeRef = useRef(null)
  const [weeklyTeamData, setWeeklyTeamData] = useState(null)
  const [todayRecord, setTodayRecord] = useState([])
  const [displayRecord, setDisplayRecord] = useState([])
  const [editingRecordKey, setEditingRecordKey] = useState(null)
  const [dynamicHeight, setDynamicHeight] = useState(0)
  const [writtenData, setWrittenData] = useState(null)
  const [writtenDataLoaded, setWrittenDataLoaded] = useState(false)
  const [realtimeRoundLoaded, setRealtimeRoundLoaded] = useState(false)
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
  const canWriteFirestoreRecord =
    thisDay === 0 &&
    currentTime >= gameStartTime &&
    currentTime <= gameEndTime
  const canFinalizeFirestoreRecord =
    thisDay === 0 &&
    showMVP &&
    currentTime >= gameEndTime &&
    currentTime <= recordTapCloseTime
  const canWriteFirestoreStats =
    canWriteFirestoreRecord || canFinalizeFirestoreRecord

  useEffect(() => {
    if (totalWeeklyTeamData?.length) {
      setWeeklyTeamData(totalWeeklyTeamData[totalWeeklyTeamData.length - 1])
    }
  }, [totalWeeklyTeamData])

  useEffect(() => {
    const container = writeContainerRef.current
    if (!container) return

    const measureHeight = () => setRegisterHeight(container.getBoundingClientRect().height)
    measureHeight()
    const observer = new ResizeObserver(measureHeight)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (thisDay !== 6) {
      setOpen(true)
    }
    setCanRegister(canWriteFirestoreRecord)

    if (thisDay === 0) {
      if (currentTime >= gameEndTime && currentTime <= recordTapCloseTime) {
        setShowMVP(true)
        setShowRequestUpdateButton(true)
      }
    }
  }, [thisDay, weeklyTeamData, canWriteFirestoreRecord])

  // daily 실시간 record
  useEffect(() => {
    setLoadingFlag(true)
    if (todaysRealtimeRound === null || todaysRealtimeRound === undefined) return
    setRealtimeRoundLoaded(true)
    if (thisDay <= 6 && thisDay >= 1) {
      setLoadingFlag(false)
    }
    const data = todaysRealtimeRound
    if (Object.keys(data).length === 0) {
      setTodayRecord([])
      setDisplayRecord([])
      setLoadingFlag(false)
      return
    }

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
    setLoadingFlag(false)
  }, [todaysRealtimeRound, totalWeeklyTeamData])

  useEffect(() => {
    if (!editingRecordKey || !realtimeRoundLoaded) return
    const stillExists = displayRecord.some((round, roundIndex) =>
      round.goals?.some((goal) => `${roundIndex}:${goal.id}` === editingRecordKey),
    )
    if (!stillExists) setEditingRecordKey(null)
  }, [displayRecord, editingRecordKey, realtimeRoundLoaded])

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

  // 오늘의 기록된 데이터 가져오기
  useEffect(() => {
    const yearRecord = firestoreRecord?.[thisYear]
    if (!yearRecord) return

    const data = yearRecord.find((obj) => obj.id === today)
    setWrittenData(data?.data ?? null)
    setWrittenDataLoaded(true)
  }, [firestoreRecord, thisYear, today])

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
        const participant = getRoundParticipants(
          weeklyTeamData,
          lastRoundValue.teamList,
        )
        await update(lastRoundRef, {
          participant,
          winnerTeam: {
            number: mostGetGoalTeam,
            member:
              mostGetGoalTeam.length === 1
                ? weeklyTeamData.data[String(mostGetGoalTeam[0])]
                : weeklyTeamData.data[String(mostGetGoalTeam[0])].concat(weeklyTeamData.data[String(mostGetGoalTeam[1])])
          },
          lostTeam: mostGetGoalTeam.length === 1 && lastRoundValue.teamList.find(
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

  const resolveMember = useMemo(() =>
    createRecordMemberResolver(existingMembers, oneCharacterMembers, membersNickName),
  [existingMembers, oneCharacterMembers, membersNickName])

  const formatRecordByName = useCallback((goalRecord, roundRecord) => {
    if (
      weeklyTeamData?.data &&
      weeklyTeamData.id === thisYear.slice(2, 4) + today
    ) {
      return formatDailyRecordStats(weeklyTeamData, goalRecord, roundRecord, resolveMember)
    }
  }, [weeklyTeamData, thisYear, today, resolveMember])

  function compareObjects(objA, objB) {
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)
    const statKeys = ['출석', '골', '어시', '승점', '경기']

    if (keysA.length !== keysB.length) {
      return false
    }
    for (let key of keysA) {
      if (!objB[key]) {
        return false
      }

      if (statKeys.some((statKey) => objA[key][statKey] !== objB[key][statKey])) {
        return false
      }
    }
    return true
  }

  const hasRecordActivity = (recordData) => {
    if (!recordData) return false

    return Object.values(recordData).some((stats) =>
      ['골', '어시', '승점', '경기'].some(
        (statKey) => Number(stats?.[statKey] || 0) > 0,
      ),
    )
  }

  // Firestore 데이터 등록
  const stats = useMemo(() => {
    return formatRecordByName(todayRecord, displayRecord)
  }, [todayRecord, displayRecord, formatRecordByName])

  const registerRecord = async () => {
    if (!canWriteFirestoreStats) {
      console.warn('Firestore record write blocked outside allowed record window')
      return
    }

    try {
      console.log('스탯: ', stats)
      const docRef = doc(db, thisYear, today)
      await setDoc(docRef, stats)
      console.log('Document updated with ID: ', docRef.id)

      // [중요] Firestore 저장 후 로컬 상태도 즉시 동기화
      setWrittenData(stats)

    } catch (error) {
      console.error("Error writing document: ", error)
    }
  }

  useEffect(() => {
    // stats가 유효하고, 기록이 있으며, 등록 가능한 상태일 때
    const canSaveRecord = canWriteFirestoreStats
    const dataLoaded = writtenDataLoaded && realtimeRoundLoaded
    const shouldSkipInitialAttendanceOnly =
      hasRecordActivity(writtenData) && !hasRecordActivity(stats)

    if (
      stats &&
      Object.keys(stats).length > 0 &&
      todayRecord &&
      canSaveRecord &&
      dataLoaded &&
      !shouldSkipInitialAttendanceOnly
    ) {
      // 1. 아직 저장된 데이터가 없으면 저장
      if (!writtenData) {
        registerRecord()
      }
      // 2. 저장된 데이터가 있지만, 현재 계산된 stats와 다르면 저장
      else if (!compareObjects(stats, writtenData)) {
        console.log('regiserrecord')
        registerRecord()
      }
    }
  }, [
    stats,
    canWriteFirestoreStats,
    writtenData,
    writtenDataLoaded,
    realtimeRoundLoaded,
    thisYear,
    today,
  ])

  useEffect(() => {
    function setHeight() {
      const height = Math.max(120,
        window.innerHeight -
        (headerHeight + registerHeight + feverTimeHeight + 50))
      setDynamicHeight(height)
    }
    setHeight()
    window.addEventListener('resize', setHeight)
    return () => window.removeEventListener('resize', setHeight)
  }, [requestUpdateMode, registerHeight, feverTimeHeight, headerHeight])

  useEffect(() => {
    if (feverTimeRef.current) {
      setFeverTimeHeight(feverTimeRef.current.clientHeight + 50)
    } else {
      setFeverTimeHeight(0)
    }
  }, [feverTimeRef?.current?.clientHeight, showFeverTime, isFeverTime])

  return (
    <div className={tapContainerStyle}>
      {loadingFlag && (
        <div className="fixed z-20 bg-white dark:bg-gray-950 w-full h-[80%] flex items-center justify-center">
          {/*<div className="bg-loading bg-[length:100%_100%] w-[200px] h-[200px]" />*/}

          <ParticleFootballLoader />
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
                recordData={firestoreRecord ? firestoreRecord[thisYear] : []}
                year={thisYear}
                today={today}
              />
              <TeamScorePopup
                showMVP={showMVP}
                setShowMVP={setShowMVP}
                recordData={displayRecord}
                weeklyTeamData={weeklyTeamData}
              />
            </div>
          )}
          <RecordContainer
            burstTargetRef={recordBurstTargetRef}
            burstControllerRef={recordBurstControllerRef}
            open={open}
            showMVP={showMVP}
            lastRecord={lastRecord}
            isFeverTime={isFeverTime}
            canRegister={canRegister}
            setPopupType={setPopupType}
            playingTeams={playingTeams}
            dynamicHeight={dynamicHeight}
            editingRecordKey={editingRecordKey}
            setEditingRecordKey={setEditingRecordKey}
            displayRecord={displayRecord}
            weeklyTeamData={weeklyTeamData}
            recordsLoaded={realtimeRoundLoaded}
            setPlayingTeams={setPlayingTeams}
            setPendingRoundId={setPendingRoundId}
            setShowSelectTeamPopup={setShowSelectTeamPopup}
            setSelectTeamPopupMessage={setSelectTeamPopupMessage}
            setSelectScorerTeamPopupMessage={setSelectScorerTeamPopupMessage}
            setShowSelectScorerTeamPopup={setShowSelectScorerTeamPopup}
            formatRecordByName={formatRecordByName}
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
            burstTargetRef={recordBurstTargetRef}
            onPrepareBurst={prepareRecordBurst}
            open={open}
            popupType={popupType}
            scorerTeam={scorerTeam}
            requestList={requestList}
            containerRef={writeContainerRef}
            editingRecordKey={editingRecordKey}
            canRegister={canRegister}
            playingTeams={playingTeams}
            weeklyTeamData={weeklyTeamData}
            pendingRoundId={pendingRoundId}
            requestUpdateMode={requestUpdateMode}
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
