import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { getDatabase, ref, get, set, update } from 'firebase/database'
import { uid } from 'uid'
import getTimes from '@/hooks/getTimes.js'
import WriteBox from '@/components/organisms/WriteBox.jsx'
import InfoMessageBox from '@/components/molecules/InfoMessageBox.jsx'
import ShowRequestButton from '@/components/atoms/Button/ShowRequestButton.jsx'
import RequestBox from '@/components/organisms/RequestBox.jsx'
import Separator from '@/components/atoms/Separator.jsx'

const ALL_TEAMS = ['1', '2', '3']

// ---------------------- 순수 헬퍼들 ----------------------

// 배열에서 처음으로 "2번 이상" 나온 숫자 리턴 (없으면 null)
const getNumberAtLeastTwo = (arr) => {
  const countMap = {}

  for (const num of arr) {
    countMap[num] = (countMap[num] || 0) + 1
    if (countMap[num] === 2) return num
  }
  return null
}

// 오늘 라운드 ref 만드는 헬퍼
const getRoundRef = (db, thisYear, today, roundId) =>
  ref(db, `${thisYear}/${today}_rounds/${roundId}`)

// 골 기록 3군데 저장
const saveGoalRecord = async (db, thisYear, today, roundId, record) => {
  const { id } = record

  const goalRef = ref(db, `${thisYear}/${today}_rounds/${roundId}/goal/${id}`)
  await set(goalRef, record)

  await set(ref(db, `${thisYear}/${today}/${id}`), record)
  await set(ref(db, `${thisYear}/${today}_backup/${id}`), record)
}

// 라운드에 teamList 채우기 (없거나 2개 미만일 때만)
const ensureRoundTeamList = async (db, thisYear, today, roundId, playingTeams) => {
  const roundRef = getRoundRef(db, thisYear, today, roundId)
  const snap = await get(roundRef)
  const roundData = snap.val() || {}

  if (Array.isArray(roundData.teamList) && roundData.teamList.length >= 2) {
    return roundData
  }

  const newTeamList = Array.isArray(roundData.teamList)
    ? [...new Set([...roundData.teamList, ...playingTeams])]
    : [...playingTeams]

  await update(roundRef, { teamList: newTeamList })
  return { ...roundData, teamList: newTeamList }
}

// ---------------------- 컴포넌트 ----------------------

const WriteContainer = (props) => {
  const {
    weeklyTeamData,
    scrollContainerRef,
    registerRef,
    open,
    canRegister,
    setLastRecord,
    requestUpdateMode,
    setRequestUpdateMode,
    showRequestUpdateButton,
    requestList,
    scorerTeam,
    pendingRoundId,
    setPendingRoundId,
    popupType,
    setPopupType,
    setScorerTeam,
    showSelectTeamPopup,
    handleRoundWinnerTrigger,
    showSelectScorerTeamPopup,
    setShowSelectTeamPopup,
    setSelectTeamPopupMessage,
    setHandleRoundWinnerTrigger,
    setShowSelectScorerTeamPopup,
    setSelectScorerTeamPopupMessage,
    playingTeams,
    setPlayingTeams,
  } = props

  const {
    time: { today, thisYear, currentTime, gameStartTime, gameEndTime },
  } = getTimes()

  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  const [storedGoalData, setStoredGoalData] = useState(null)
  // const [pendingRoundId, setPendingRoundId] = useState(null)

  const writeBoxPropsData = {
    scorer,
    setScorer,
    assistant,
    setAssistant,
  }

  const db = getDatabase()

  // ---------------------- 라운드/우승 처리 헬퍼들 ----------------------

  // 라운드 우승 처리 + 다음 라운드 세팅
  const handleRoundWinner = async (roundId, winner) => {
    if (!winner) return

    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const roundSnap = await get(roundRef)
    const roundData = roundSnap.val()

    // 이긴 팀 해당 라운드에 winnerTeam 업데이트
    await update(roundRef, { winnerTeam: {number: winner, member: weeklyTeamData.data[winner]} })

    // 다음 라운드 구성
    const roundTeam = (roundData.teamList || []).map(String)
    const newRoundId = await createRound()
    const restTeam = ALL_TEAMS.find((team) => !roundTeam.includes(team))
    const nextTeamList = [restTeam, String(winner)]

    const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)

    // 이긴팀, 쉬고 있던 팀 다음 라운드에 teamList 업데이트
    setPlayingTeams(new Set(nextTeamList))
    await update(newRoundRef, { teamList: nextTeamList })
  }

  // getGoalTeam 에 팀 추가 + 우승 여부 체크
  const applyTeamGoal = async (roundId, teamNumber) => {
    const goalTeamRef = ref(
      db,
      `${thisYear}/${today}_rounds/${roundId}/getGoalTeam`,
    )
    const goalTeamSnap = await get(goalTeamRef)
    console.log('goalTeamSnap.val():', goalTeamSnap.val())
    const currentList =
      goalTeamSnap.exists() && Array.isArray(goalTeamSnap.val())
        ? goalTeamSnap.val()
        : []

    currentList.push(teamNumber)
    console.log('currnetList: ', currentList)

    const winner = getNumberAtLeastTwo(currentList)
    console.log('winner: ', winner)
    // 2골 이상 득점한 팀 바로 승리 처리
    if (winner) {
      await handleRoundWinner(roundId, winner)
    }

    await set(goalTeamRef, currentList)
  }

  // scorer가 속한 팀을 찾아서 applyTeamGoal 실행
  const updateGoalTeam = async (roundId, scorerName) => {
    let teamNumber = Object.keys(weeklyTeamData.data).find((k) =>
      weeklyTeamData.data[k].includes(scorerName),
    )
    console.log(teamNumber)

    // 팀을 못 찾으면 팝업 열어서 선택 받기
    if (!teamNumber || scorerName === '용병') {
      console.log('no teamNumber for scorer', scorerName)
      setShowSelectScorerTeamPopup(true)
      setSelectTeamPopupMessage('어느 팀의 득점인가요?')
      return
    }

    await applyTeamGoal(roundId, teamNumber)
  }

  // ---------------------- 라운드 생성 ----------------------

  const createRound = async () => {
    const oneMinuteLater = new Date(currentTime.getTime() + 1 * 60 * 1000)
    const time =
      oneMinuteLater.getHours().toString().padStart(2, '0') +
      ':' +
      oneMinuteLater.getMinutes().toString().padStart(2, '0') +
      ':' +
      oneMinuteLater.getSeconds().toString().padStart(2, '0')

    const roundId = uid()
    const dateRef = ref(db, `${thisYear}/${today}_rounds`)
    const snapshot = await get(dateRef)

    let roundIndex
    let startTime

    if (!snapshot.val()) {
      roundIndex = 0
      startTime = '08:00:00'
    } else {
      const rounds = snapshot.val()
      const roundValues = Object.values(rounds)

      if (roundValues.length > 0) {
        const lastRound = roundValues.reduce((prev, cur) => {
          const prevIndex = typeof prev.index === 'number' ? prev.index : -1
          const curIndex = typeof cur.index === 'number' ? cur.index : -1
          return curIndex > prevIndex ? cur : prev
        })

        // 아직 안 끝난 라운드 있으면 그 라운드 계속 사용
        if (!lastRound.winnerTeam) {
          return lastRound.id
        }
      }

      const indices = roundValues.map((r) =>
        typeof r.index === 'number' ? r.index : 0,
      )

      const maxIndex = indices.length ? Math.max(...indices) : -1

      roundIndex = maxIndex + 1
      startTime = time
    }

    const roundRef = getRoundRef(db, thisYear, today, roundId)

    const roundData = {
      id: roundId,
      index: roundIndex,
      time: startTime,
      winnerTeam: null,
      teamList: [],
      getGoalTeam: [],
      pointWinners: [],
    }

    await set(roundRef, roundData)
    return roundId
  }

  // ---------------------- Effect: 팀 선택 팝업 닫힌 후 처리 ----------------------

  useEffect(() => {
    const run = async () => {
      const roundRef = ref(db, `${thisYear}/${today}_rounds`)
      const roundSnap = await get(roundRef)
      const rounds = roundSnap.val()
      if (!rounds) return

      const lastRoundObj = Object.values(rounds).reduce((max, cur) =>
        cur.index > max.index ? cur : max,
      )
      const lastRoundId = lastRoundObj.id
      console.log('scorerTeam: ', scorerTeam)
      await applyTeamGoal(lastRoundId, scorerTeam)
      await applyTeamGoal(lastRoundId, scorerTeam)
      setHandleRoundWinnerTrigger(false)
      setScorerTeam(null)
      console.log(lastRoundId)
    }
    if (handleRoundWinnerTrigger) {
      run()
    }
  }, [handleRoundWinnerTrigger])

  useEffect(() => {
    if (showSelectTeamPopup) return
    if (!pendingRoundId) return

    const run = async () => {
      const roundId = pendingRoundId

      // 1) 라운드 teamList 채우기
      await ensureRoundTeamList(db, thisYear, today, roundId, playingTeams)

      console.log('popupType: ', popupType)
      if (popupType === 'playing') {
        // 2) 득점자의 팀 getGoalTeam에 추가
        await updateGoalTeam(roundId, storedGoalData.goal)

        // 3) 골 기록 저장
        await saveGoalRecord(db, thisYear, today, roundId, storedGoalData)

        // 4) UI 정리
        setLastRecord(storedGoalData.id)
        setScorer('')
        setAssistant('')
        setStoredGoalData(null)
        setPendingRoundId(null)

        setTimeout(() => {
          scrollToElement()
        }, 300)
      } else {
        setSelectScorerTeamPopupMessage('가위바위보 어느 팀이 이겼나요?')
        setShowSelectScorerTeamPopup(true)
        setPopupType('')
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelectTeamPopup, storedGoalData, pendingRoundId])

  // ---------------------- Effect: scorerTeam 팝업에서 선택 후 처리 ----------------------

  useEffect(() => {
    const run = async () => {
      // 마지막 라운드 찾기
      const roundRef = ref(db, `${thisYear}/${today}_rounds`)
      const roundSnap = await get(roundRef)
      const rounds = roundSnap.val()
      if (!rounds) return

      const lastRoundObj = Object.values(rounds).reduce((max, cur) =>
        cur.index > max.index ? cur : max,
      )
      const lastRoundId = lastRoundObj.id

      // 선택된 팀을 득점 팀으로 반영
      await applyTeamGoal(lastRoundId, scorerTeam)

      setScorerTeam(null)
    }

    if (showSelectScorerTeamPopup) return
    if (scorerTeam) {
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelectScorerTeamPopup, scorerTeam])

  // ---------------------- 골 등록 핸들러 ----------------------

  const registerHandler = async () => {
    const day = currentTime.getDay()

    if (
      ![0, 7].includes(day) &&
      currentTime >= gameStartTime &&
      currentTime <= gameEndTime
    ) {
      Swal.fire({
        icon: 'error',
        text: '기록 가능 시간이 아닙니다.',
      })
      return
    }

    if (!scorer.trim()) return

    const time =
      currentTime.getHours().toString().padStart(2, '0') +
      ':' +
      currentTime.getMinutes().toString().padStart(2, '0') +
      ':' +
      currentTime.getSeconds().toString().padStart(2, '0')

    const goalId = uid()
    const roundId = await createRound()

    const record = {
      id: goalId,
      time,
      goal: scorer.trim(),
      assist: assistant.trim(),
    }

    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const roundSnap = await get(roundRef)
    const roundData = roundSnap.val()

    // 팀 정보 아직 없음 → 팝업 띄우고 여기서 멈춤
    if (!roundData.teamList || roundData.teamList.length < 2) {
      if (roundData.index < 1) {
        setSelectTeamPopupMessage('경기 중인 팀을 선택해주세요')
        setShowSelectTeamPopup(true)
        setStoredGoalData(record)
        setPendingRoundId(roundId)
        return
      } else {
        const wholeSnap = await get(ref(db, `${thisYear}/${today}_rounds`))
        console.log('wholeSnap: ', wholeSnap.val())
      }
    }

    // 팀 정보 이미 있으면 → 바로 저장
    await updateGoalTeam(roundId, record.goal)
    await saveGoalRecord(db, thisYear, today, roundId, record)

    setLastRecord(goalId)
    setScorer('')
    setAssistant('')
    setTimeout(() => {
      scrollToElement()
    }, 300)
  }

  // ---------------------- 스크롤 내려주기 ----------------------

  const scrollToElement = () => {
    const scrollContainer = scrollContainerRef.current

    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + scrollContainer.clientHeight,
        behavior: 'smooth',
      })
    }
  }

  // ---------------------- 렌더 ----------------------

  return (
    <div
      className={
        !canRegister ? 'w-full' : 'flex flex-col items-center mt-4 w-[80%]'
      }
    >
      {canRegister && <Separator fullWidth={true} />}

      {canRegister ? (
        <WriteBox
          registerRef={registerRef}
          registerHandler={registerHandler}
          data={writeBoxPropsData}
        />
      ) : (
        <div className="relative flex justify-center">
          {!requestUpdateMode ? (
            <div>
              <InfoMessageBox open={open} />
              {showRequestUpdateButton && (
                <ShowRequestButton setRequestUpdateMode={setRequestUpdateMode} />
              )}
            </div>
          ) : (
            <RequestBox
              requestList={requestList}
              setRequestUpdateMode={setRequestUpdateMode}
              today={today}
              currentTime={currentTime}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default WriteContainer
