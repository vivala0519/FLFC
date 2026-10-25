import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { getDatabase, ref, get, set, update, runTransaction } from 'firebase/database'
import { uid } from 'uid'
import getTimes from '@/hooks/getTimes.js'
import getMembers from '@/hooks/getMembers.js'
import WriteBox from '@/components/organisms/WriteBox.jsx'
import InfoMessageBox from '@/components/molecules/InfoMessageBox.jsx'
import ShowRequestButton from '@/components/atoms/Button/ShowRequestButton.jsx'
import RequestBox from '@/components/organisms/RequestBox.jsx'
import Separator from '@/components/atoms/Separator.jsx'
import { getRoundParticipants } from '@/apis/roundParticipants.js'
import { createRecordMemberResolver, findWeeklyMemberTeam } from '@/apis/recordMembers.js'
import { isFeverRound } from '@/apis/roundFever.js'

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

// 라운드 골 기록과 백업 저장
const saveGoalRecord = async (db, thisYear, today, roundId, record, fever = false) => {
  if (!record) return
  const { id } = record
  const savedRecord = fever ? { ...record, fever: true, team: '' } : { ...record, fever: false }

  const goalRef = ref(db, `${thisYear}/${today}_rounds/${roundId}/goal/${id}`)
  await set(goalRef, savedRecord)

  await set(ref(db, `${thisYear}/${today}_backup/${id}`), savedRecord)
}

// 라운드에 teamList 채우기
const ensureRoundTeamList = async (db, thisYear, today, roundId, playingTeams) => {
  const roundRef = getRoundRef(db, thisYear, today, roundId)
  const snap = await get(roundRef)
  const roundData = snap.val() || {}
  if (isFeverRound(roundData)) return roundData
  const result = await runTransaction(roundRef, (currentRound) => {
    if (!currentRound || isFeverRound(currentRound)) return undefined
    return { ...currentRound, teamList: [...playingTeams] }
  }, { applyLocally: false })
  return result.snapshot.val() || roundData
}

// ---------------------- 컴포넌트 ----------------------

const WriteContainer = (props) => {
  const {burstTargetRef,
    onPrepareBurst,
    weeklyTeamData,
    containerRef,
    editingRecordKey,
    open,
    canRegister,
    isOffDay,
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
    setPlayingTeams,} = props

  const {time: { today, thisYear, currentTime },} = getTimes()
  const { existingMembers, oneCharacterMembers, membersNickName } = getMembers()
  const resolveMember = createRecordMemberResolver(existingMembers, oneCharacterMembers, membersNickName)

  const [scorer, setScorer] = useState('')
  const [assistant, setAssistant] = useState('')
  const [storedGoalData, setStoredGoalData] = useState(null)
  const [isWriting, setIsWriting] = useState(false)

  useEffect(() => {
    if (canRegister) return
    setStoredGoalData(null)
    setIsWriting(false)
  }, [canRegister])

  const writeBoxPropsData = {
    scorer,
    setScorer,
    assistant,
    setAssistant,
  }

  const db = getDatabase()

  const getMemberTeam = (name) => {
    return findWeeklyMemberTeam(weeklyTeamData, name, resolveMember)
  }

  const getRecordName = (input) => {
    const name = input.trim()
    const member = resolveMember(name)
    if (!member || member === name || !Object.prototype.hasOwnProperty.call(membersNickName, name)) return name

    const shortName = oneCharacterMembers.includes(member) ? member.slice(-1) : member.slice(1)
    return resolveMember(shortName) === member ? shortName : member
  }

  const openScorerTeamPopup = (roundData, record) => {
    setPlayingTeams(new Set((roundData?.teamList || []).map(String)))
    setSelectScorerTeamPopupMessage('어느 팀의 득점인가요?')
    setShowSelectScorerTeamPopup(true)
    setStoredGoalData(record)
  }

  // ---------------------- 라운드/우승 처리 헬퍼들 ----------------------

  // 라운드 우승 처리 + 다음 라운드 세팅
  const handleRoundWinner = async (roundId, winner, fromDraw) => {
    if (!winner) return

    const roundRef = getRoundRef(db, thisYear, today, roundId)
    await get(roundRef)
    const result = await runTransaction(roundRef, (roundData) => {
      if (!roundData || isFeverRound(roundData) || roundData.winnerTeam) return undefined
      return {
        ...roundData,
        winnerTeam: {
          number: fromDraw ? roundData.teamList : [winner],
          member: fromDraw ? getRoundParticipants(weeklyTeamData, roundData.teamList) : weeklyTeamData.data[winner],
        },
        lostTeam: !fromDraw && roundData.teamList.find(team => team !== winner),
      }
    }, { applyLocally: false })
    if (!result.committed) return
    const roundData = result.snapshot.val()

    // 다음 라운드 구성
    const roundTeam = (roundData.teamList || []).map(String)
    const newRoundId = await createRound()
    if (newRoundId === roundId) return
    const restTeam = ALL_TEAMS.find((team) => !roundTeam.includes(team))
    let nextTeamList = [restTeam, String(winner)]
    const isThirdTeamBlank = weeklyTeamData.data['3'].every((v) => v.trim() === '')
    if (isThirdTeamBlank) {
      nextTeamList = ['1', '2']
    }

    const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)

    // 이긴팀, 쉬고 있던 팀 다음 라운드에 teamList 업데이트
    setPlayingTeams(new Set(nextTeamList))
    await runTransaction(newRoundRef, (nextRound) => {
      if (!nextRound || isFeverRound(nextRound)) return undefined
      return { ...nextRound, teamList: nextTeamList }
    }, { applyLocally: false })
  }

  // getGoalTeam 에 팀 추가 + 우승 여부 체크
  const applyTeamGoal = async (roundId, teamNumber, fromDraw) => {
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    await get(roundRef)
    const result = await runTransaction(roundRef, (roundData) => {
      if (!roundData || isFeverRound(roundData)) return undefined
      const currentList = Array.isArray(roundData.getGoalTeam) ? [...roundData.getGoalTeam] : []
      currentList.push(teamNumber)
      if (fromDraw) currentList.push(teamNumber)
      return { ...roundData, getGoalTeam: currentList }
    }, { applyLocally: false })
    if (!result.committed) return false

    const winner = getNumberAtLeastTwo(result.snapshot.val().getGoalTeam)
    // 2골 이상 득점한 팀 바로 승리 처리
    if (winner) {
      await handleRoundWinner(roundId, winner, fromDraw)
    }

    return true
  }

  // scorer가 속한 팀을 찾아서 applyTeamGoal 실행
  const updateGoalTeam = async (roundId, scorerName, record) => {
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const roundSnap = await get(roundRef)
    const roundData = roundSnap.val()
    if (isFeverRound(roundData)) {
      await saveGoalRecord(db, thisYear, today, roundId, record, true)
      setStoredGoalData(null)
      return
    }
    const roundTeamList = (roundData?.teamList || []).map(String)
    let teamNumber = getMemberTeam(scorerName)

    if (!teamNumber && record.assist) {
      teamNumber = getMemberTeam(record.assist)
    }

    // 팀을 못 찾으면 팝업 열어서 선택 받기
    if (!teamNumber) {
      console.log('no teamNumber for scorer', scorerName)
      await openScorerTeamPopup(roundData, record)
      return
    }

    if (!roundTeamList.includes(String(teamNumber))) {
      await openScorerTeamPopup(roundData, record)
      return
    }

    const applied = await applyTeamGoal(roundId, teamNumber)
    await saveGoalRecord(db, thisYear, today, roundId, record, !applied)
    setStoredGoalData(null)
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

        // Fever goals stay in the last round, even while its result is being finalized.
        if (isFeverRound(lastRound) || !lastRound.winnerTeam) return lastRound.id

        const lastRoundRef = getRoundRef(db, thisYear, today, lastRound.id)
        const participant = getRoundParticipants(
          weeklyTeamData,
          lastRound.teamList,
        )
        if (participant.length > 0) {
          await update(lastRoundRef, { participant })
        }
      }

      const indices = roundValues.map((r) =>
        typeof r.index === 'number' ? r.index : 0,
      )

      const maxIndex = indices.length ? Math.max(...indices) : -1

      roundIndex = maxIndex + 1
      startTime = time
    }

    const newRoundId = String(roundIndex + 1).padStart(2, '0')
    const roundRef = getRoundRef(db, thisYear, today, newRoundId)

    const roundData = {
      id: newRoundId,
      index: roundIndex,
      time: startTime,
      winnerTeam: null,
      teamList: [],
      getGoalTeam: [],
      pointWinners: [],
      updated: false,
      participant: [],
    }

    await set(roundRef, roundData)
    return newRoundId
  }

  // ---------------------- Effect: 팀 선택 팝업 닫힌 후 처리 ----------------------

  useEffect(() => {
    const run = async () => {
      if (!canRegister) return
      const roundRef = ref(db, `${thisYear}/${today}_rounds`)
      const roundSnap = await get(roundRef)
      const rounds = roundSnap.val()
      if (!rounds) return

      const lastRoundObj = Object.values(rounds).reduce((max, cur) =>
        cur.index > max.index ? cur : max,
      )
      const lastRoundId = lastRoundObj.id
      await applyTeamGoal(lastRoundId, scorerTeam, true)
      setHandleRoundWinnerTrigger(null)
      setScorerTeam(null)
      setPendingRoundId(null)
    }
    if (handleRoundWinnerTrigger) {
      run()
    }
  }, [handleRoundWinnerTrigger, canRegister])

  useEffect(() => {
    if (!canRegister) return
    if (showSelectTeamPopup) return
    if (showSelectScorerTeamPopup) return
    if (!pendingRoundId) return

    const run = async () => {
      const roundId = pendingRoundId

      // 1) 라운드 teamList 채우기
      const roundData = await ensureRoundTeamList(db, thisYear, today, roundId, playingTeams)

      if (popupType === 'playing' || (isFeverRound(roundData) && storedGoalData)) {
        // 2) 득점자의 팀 getGoalTeam에 추가
        await updateGoalTeam(roundId, storedGoalData.goal, storedGoalData)

        // 4) UI 정리
        setLastRecord(storedGoalData.id)
        setScorer('')
        setAssistant('')
        setStoredGoalData(null)
        setPendingRoundId(null)

        setTimeout(() => {
          setIsWriting(false)
        }, 300)
      } else {
        setSelectScorerTeamPopupMessage('가위바위보 어느 팀이 이겼나요?')
        setShowSelectScorerTeamPopup(true)
        setPopupType('')
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelectTeamPopup, storedGoalData, pendingRoundId, canRegister])

  // ---------------------- Effect: scorerTeam 팝업에서 선택 후 처리 ----------------------

  useEffect(() => {
    const run = async () => {
      // 마지막 라운드 찾기
      if (!canRegister) return
      const roundRef = ref(db, `${thisYear}/${today}_rounds`)
      const roundSnap = await get(roundRef)
      const rounds = roundSnap.val()
      if (!rounds) return

      const lastRoundObj = Object.values(rounds).reduce((max, cur) =>
        cur.index > max.index ? cur : max,
      )
      const lastRoundId = lastRoundObj.id

      // 선택된 팀을 득점 팀으로 반영
      const applied = await applyTeamGoal(lastRoundId, scorerTeam)
      await saveGoalRecord(db, thisYear, today, lastRoundId, storedGoalData, !applied)

      setScorerTeam(null)
      setStoredGoalData(null)
      setScorer('')
      setAssistant('')
      setTimeout(() => {
        setIsWriting(false)
      }, 300)
      // setPendingRoundId(null)
    }

    if (showSelectScorerTeamPopup) return
    if (scorerTeam && !handleRoundWinnerTrigger) {
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelectScorerTeamPopup, scorerTeam, canRegister])

  // ---------------------- 골 등록 핸들러 ----------------------

  const registerHandler = async () => {
    if (editingRecordKey) return
    if (!canRegister) {
      Swal.fire({
        icon: 'error',
        text: '기록 가능 시간이 아닙니다.',
      })
      return
    }

    if (!scorer.trim()) return

    setIsWriting(true)

    const time =
      currentTime.getHours().toString().padStart(2, '0') +
      ':' +
      currentTime.getMinutes().toString().padStart(2, '0') +
      ':' +
      currentTime.getSeconds().toString().padStart(2, '0')

    const goalId = uid()
    const roundId = await createRound()

    const scorerName = getRecordName(scorer)
    const assistantName = getRecordName(assistant)

    const checkMemberHandler = (roundData) => {
      const roundTeamList = (roundData.teamList || []).map(String)
      const scorerMemberTeam = getMemberTeam(scorerName)

      if (
        scorerMemberTeam &&
        !roundTeamList.includes(String(scorerMemberTeam))
      ) {
        openScorerTeamPopup(roundData, record)
        return false
      }

      const assistantMemberTeam = getMemberTeam(assistantName)
      if (
        !scorerMemberTeam &&
        assistantMemberTeam &&
        !roundTeamList.includes(String(assistantMemberTeam))
      ) {
        openScorerTeamPopup(roundData, record)
        return false
      }

      if (!scorerMemberTeam && !assistantMemberTeam && !['용병', '자책'].includes(scorerName)) {
        openScorerTeamPopup(roundData, record)
        return false
      }

      return true
    }

    const record = {
      id: goalId,
      time,
      goal: scorerName.trim(),
      assist: assistantName.trim(),
    }
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const roundSnap = await get(roundRef)
    const roundData = roundSnap.val()
    if (isFeverRound(roundData)) {
      await saveGoalRecord(db, thisYear, today, roundId, record, true)
    } else {

      // 팀 정보 아직 없음 → 팝업 띄우고 여기서 멈춤
      if (!roundData.teamList || roundData.teamList.length < 2) {
        if (roundData.index < 1) {
          // 두 팀뿐인 케이스
          const isThirdTeamBlank = weeklyTeamData.data['3'].every((v) => v.trim() === '')
          if (isThirdTeamBlank) {
            roundData.teamList = ['1', '2']
            await update(roundRef, { teamList: ['1', '2'] })

            const checkMember = checkMemberHandler(roundData)
            if (!checkMember) return
            await updateGoalTeam(roundId, record.goal, record)

            setLastRecord(goalId)
            setScorer('')
            setAssistant('')
            setTimeout(() => {
              setIsWriting(false)
            }, 300)
            return
          }
          setSelectTeamPopupMessage('경기 중인 팀을 선택해주세요')
          setShowSelectTeamPopup(true)
          setStoredGoalData(record)
          setPendingRoundId(roundId)
          return
        } else {
          const wholeSnap = await get(ref(db, `${thisYear}/${today}_rounds`))
        }
      } else {
        const isPastMoreThanMinutes = (gameTime, minutes = 10, now = currentTime) => {
          const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(gameTime)
          if (!m) return false

          const [, hh, mm, ss] = m.map(Number)

          const target = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hh,
            mm,
            ss,
            0,
          )

          const diffMs = now - target
          return diffMs >= minutes * 60 * 1000
        }
        if (isPastMoreThanMinutes(roundData.time, 11)) {
          Swal.fire({
            title: '10분 이상 지난 라운드예요',
            icon: 'warning',
            text: '이전 라운드가 종료됐는지 확인해주세요. 해당 라운드가 맞나요?',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '계속',
            cancelButtonText: '취소',
          }).then( async (result) => {
            if (result.isConfirmed) {
              const checkMember = checkMemberHandler(roundData)
              if (!checkMember) return

              setStoredGoalData(record)

              await updateGoalTeam(roundId, record.goal, record)

              setLastRecord(goalId)
              setScorer('')
              setAssistant('')
              setTimeout(() => {
                setIsWriting(false)
              }, 300)
            }
            if (result.isDismissed) {
              setIsWriting(false)
            }
          })
          return
        }
        const checkMember = checkMemberHandler(roundData)
        if (!checkMember) return
      }

      setStoredGoalData(record)

      // 팀 정보 이미 있으면 → 바로 저장
      await updateGoalTeam(roundId, record.goal, record)
      // await saveGoalRecord(db, thisYear, today, roundId, record)
    }

    setLastRecord(goalId)
    setScorer('')
    setAssistant('')
    setTimeout(() => {
      setIsWriting(false)
    }, 300)
  }

  // ---------------------- 렌더 ----------------------

  return (
    <div
      ref={containerRef}
      data-refresh-blocked={Boolean(editingRecordKey || isWriting || scorer.trim() || assistant.trim())}
      className={
        !canRegister ? 'w-full' : 'flex flex-col items-center mt-4 w-[80%]'
      }
    >
      {canRegister && <Separator fullWidth={true} />}

      {canRegister ? (
        <WriteBox
          isWriting={isWriting}
          editingRecordKey={editingRecordKey}
          registerHandler={registerHandler}
          data={writeBoxPropsData}
          burstTargetRef={burstTargetRef}
          onPrepareBurst={onPrepareBurst}
        />
      ) : (
        <div className="relative flex justify-center">
          {isOffDay || !requestUpdateMode ? (
            <div className={'w-[98%]'}>
              <InfoMessageBox open={open} isOffDay={isOffDay} />
              {/*{showRequestUpdateButton && (*/}
              {/*  <ShowRequestButton setRequestUpdateMode={setRequestUpdateMode} />*/}
              {/*)}*/}
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
