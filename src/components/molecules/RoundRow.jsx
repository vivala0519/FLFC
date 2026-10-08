import TimeText from '@/components/atoms/Text/TimeText.jsx'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, update, runTransaction } from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'
import { useEffect, useRef, useState } from 'react'
import { getRoundParticipants } from '@/apis/roundParticipants.js'
import getRecords from '@/hooks/getRecords.js'
import { isGameWriteAllowed } from '@/apis/gameWriteWindow.js'

const RecordRow = (props) => {
  const { time: { today, thisYear, currentTime } } = getTimes()
  const { gameStatus } = getRecords()
  const gameStatusRef = useRef(gameStatus)
  gameStatusRef.current = gameStatus
  const canEditRound = isGameWriteAllowed({ year: thisYear, day: today, status: gameStatus, now: currentTime })
  const canWrite = () => isGameWriteAllowed({ year: thisYear, day: today, status: gameStatusRef.current })
  const assertWritable = () => {
    if (canWrite()) return
    const error = new Error('기록 가능 시간이 아닙니다. 경기가 종료되었거나 상태를 확인 중입니다.')
    error.code = 'game/write-closed'
    throw error
  }
  const guardedUpdate = (reference, value) => {
    assertWritable()
    return update(reference, value)
  }
  const handleWriteError = (error) => {
    console.error('라운드 변경에 실패했습니다:', error)
    void Swal.fire({ icon: 'error', text: error.code === 'game/write-closed' ? error.message : '라운드 변경에 실패했습니다. 최신 기록을 확인해주세요.' })
  }
  const { record,
    index,
    // fakeRow,
    isOpen,
    // roundShowHandler,
    weeklyTeamData,
    setShowSelectTeamPopup,
    setPendingRoundId,
    setSelectTeamPopupMessage,
    setShowSelectScorerTeamPopup,
    setSelectScorerTeamPopupMessage,
    setPopupType,
    setPlayingTeams } = props
  const ALL_TEAMS = ['1', '2', '3']
  const [showTeamMembers, setShowTeamMembers] = useState(false)
  const [editTeamMode, setEditTeamMode] = useState(false)
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const rawStyle = `relative flex items-center justify-between mobile:justify-normal w-[85%] gap-5 mobile:gap-2 py-1 border-y-2 border-y-blue-400 dark:border-b-blue-400 py-[10px]`
  const recordAreaStyle = 'flex flex-wrap min-w-0 items-center font-dnf-forged gap-x-2 gap-y-1 w-full pl-3 relative top-[1px]'
  const roundTextStyle = 'whitespace-nowrap text-[10px] text-black dark:text-gray-100'
  const winnerDivStyle = 'flex flex-wrap min-w-0 items-center relative bottom-[2px]'
  const teamStyle = 'relative font-dnf-forged text-blueSignature dark:text-yellow-400 text-[12px] top-[1px]'
  const opponentStyle = 'font-dnf-forged text-gray-400 text-[12px] ml-1 relative top-[1px]'
  const winStyle = 'font-dnf-forged text-[12px] relative top-[1px] mr-1'
  const scoreStyle = 'font-dnf-forged text-[12px] relative top-[1px] shrink-0 whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-200 ml-1'
  // const itemStyle = `w-[35px] h-[25px] bg-[length:100%_100%] ${!isOpen ? 'rotate-180' : 'rotate-0'} `
  // const arrowIcon = 'bg-[url("@/assets/up2.png")] '
  const roundExitButtonStyle = 'text-goal dark:text-red-300 animate-pulse'


  const optionsForA = ALL_TEAMS.filter((opt) => opt !== teamB)
  const optionsForB = ALL_TEAMS.filter((opt) => opt !== teamA)

  useEffect(() => {
    if (record?.teamList?.length === 2) {
      setTeamA(record.teamList[0])
      setTeamB(record.teamList[1])
    }
  }, [record?.teamList])
  useEffect(() => {
    if (!canEditRound) setEditTeamMode(false)
  }, [canEditRound])

  const getRoundRef = (db, thisYear, today, roundId) =>
    ref(db, `${thisYear}/${today}_rounds/${roundId}`)
  // round 10분 지났는지 체크
  const isOver10Minutes = (recordTime) => {
    const [h, m, s] = recordTime.split(':').map(Number)

    const recordDate = new Date()
    recordDate.setHours(h, m, s, 0)

    const diffMs = currentTime - recordDate
    const diffMinutes = diffMs / (1000 * 60)

    return diffMinutes >= 9
  }

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

  const createRound = async () => {
    assertWritable()
    const db = getDatabase()
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

        // 아직 안 끝난 라운드 있으면 그 라운드 계속 사용
        if (!lastRound.winnerTeam) {
          return lastRound.id
        }

        const lastRoundRef = getRoundRef(db, thisYear, today, lastRound.id)
        const participant = getRoundParticipants(
          weeklyTeamData,
          lastRound.teamList,
        )
        if (participant.length > 0) {
          await guardedUpdate(lastRoundRef, { participant })
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

    assertWritable()
    const result = await runTransaction(roundRef, (currentRound) => {
      if (!canWrite()) return
      return currentRound || roundData
    }, { applyLocally: false })
    if (!result.committed) assertWritable()
    return newRoundId
  }

  const selectWinnerTeam = async () => {
    assertWritable()
    const roundId = await createRound()
    setPendingRoundId(roundId)
    setSelectTeamPopupMessage('첫 라운드 어느 팀이 경기했나요?')
    setShowSelectTeamPopup(true)
  }

  const exitRound = async (roundId) => {
    assertWritable()
    const db = getDatabase()
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const snap = await get(roundRef)
    const roundData = snap.val() || {}
    const teamList = roundData['teamList']
    if (roundData.winnerTeam) {
      window.location.reload()
      return
    }
    const mostGetGoalTeam = getMostFrequentElements(roundData.getGoalTeam || [])
    // 한골
    if (mostGetGoalTeam.length === 1) {
      await guardedUpdate(roundRef, {
        winnerTeam: {
          number: [mostGetGoalTeam[0]],
          member: weeklyTeamData.data[String(mostGetGoalTeam[0])],
        },
        lostTeam: roundData.teamList.find((team) => team !== String(mostGetGoalTeam[0]),
        ),
        participant: getRoundParticipants(weeklyTeamData, teamList),
      })
      const newRoundId = await createRound()
      const restTeam = ALL_TEAMS.find((team) => !roundData.teamList.includes(String(team)))
      let nextTeamList = [restTeam, String(mostGetGoalTeam[0])]
      const isThirdTeamBlank = weeklyTeamData.data['3'].every((v) => v.trim() === '')
      if (isThirdTeamBlank) {
        nextTeamList = ['1', '2']
      }
      const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)
      await guardedUpdate(newRoundRef, {teamList: nextTeamList})
    }
    // 무승부
    if ([0, 2].includes(mostGetGoalTeam.length)) {
      if (roundData.updated) {
        setPlayingTeams(new Set(roundData.teamList))
        setSelectScorerTeamPopupMessage('어느 팀이 이겼나요?')
        setShowSelectScorerTeamPopup(true)
        setPopupType('')
        return
      }
      // 첫 라운드 가위바위보
      if (!roundData.index || roundData.index === 0) {
        if (!roundData.teamList) {
          await selectWinnerTeam()
        } else {
          setPlayingTeams(new Set(roundData.teamList))
          setSelectScorerTeamPopupMessage('가위바위보 어느 팀이 이겼나요?')
          setShowSelectScorerTeamPopup(true)
          setPopupType('')
        }
      } else {
        // 나중에 들어온 팀 (index 0)
        await guardedUpdate(roundRef, {
          winnerTeam: {
            number: roundData.teamList,
            member: weeklyTeamData.data[String(roundData.teamList[0])].concat(
              weeklyTeamData.data[String(roundData.teamList[1])],
            ),
          },
          lostTeam: false,
          participant: getRoundParticipants(weeklyTeamData, roundData.teamList),
        })
        const newRoundId = await createRound()
        const restTeam = ALL_TEAMS.find(
          (team) => !roundData.teamList.includes(String(team)),
        )
        let nextTeamList = [restTeam, String(roundData.teamList[0])]

        const isThirdTeamBlank = weeklyTeamData.data['3'].every((v) => v.trim() === '')
        if (isThirdTeamBlank) {
          nextTeamList = ['1', '2']
        }
        const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)
        await guardedUpdate(newRoundRef, { teamList: nextTeamList })
      }
    }
  }

  const exitRoundHandler = async (roundId) => {
    if (!canWrite()) {
      try { assertWritable() } catch (error) { handleWriteError(error) }
      return
    }
    Swal.fire({
      title: '최근 라운드 종료',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '종료',
      cancelButtonText: '취소'
    }).then((result) => {
      if (result.isConfirmed) {
        void exitRound(roundId).catch(handleWriteError)
      }
    })
  }

  const cancelEditTeamMode = () => {
    setTeamA(record.teamList[0])
    setTeamB(record.teamList[1])
    setEditTeamMode(false)
  }

  const updateTeamListHandler = async (roundId) => {
    try {
      assertWritable()
      if (teamA === record.teamList[0] && teamB === record.teamList[1]) {
        setEditTeamMode(false)
        return
      }
      const db = getDatabase()
      const roundRef = getRoundRef(db, thisYear, today, roundId)
      await guardedUpdate(roundRef, { teamList: [teamA, teamB], updated: true })
      setEditTeamMode(false)
    } catch (error) {
      handleWriteError(error)
    }
  }

  const getEndedRoundDisplay = () => {
    const teamList = (record.teamList || []).map(String)
    const winnerNumbers = (record.winnerTeam?.number || []).map(String)

    if (winnerNumbers.length === 1) {
      const winner = winnerNumbers[0]
      const opponents = teamList.filter((team) => team !== winner)

      return { winner, opponents, teamList }
    }

    return { winner: null, opponents: [], teamList }
  }

  const endedRoundDisplay = getEndedRoundDisplay()
  const scoreTeams = endedRoundDisplay.winner
    ? [endedRoundDisplay.winner, ...endedRoundDisplay.opponents]
    : endedRoundDisplay.teamList
  const goalCount = Object.entries(record.goal || {}).filter(
    ([id, goal]) => id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar',
  ).length
  // Draw resolution can append team entries without actual goal records.
  const goalTeams = Array.isArray(record.getGoalTeam)
    ? record.getGoalTeam.slice(0, goalCount).map(String) : []
  const scores = scoreTeams.map((team) => goalTeams.filter((goalTeam) => goalTeam === team).length)
  const scoreText = scoreTeams.length === 2 ? scores.join(' : ') : null
  const scoreLabel = scoreTeams.map((team, i) => `${team}팀 ${scores[i]}골`).join(', ')

  const renderMembers = (members = []) => {
    if (!Array.isArray(members) || members.length === 0) return null
    const filteredMembers = members.filter(member => !member.includes('용병'))

    if (filteredMembers.length <= 6) {
      return filteredMembers.join(' ')
    }

    const firstLine = filteredMembers.slice(0, 6).join(' ')
    const secondLine = filteredMembers.slice(6).join(' ')

    return (
      <>
        {firstLine}
        <br />
        {secondLine}
      </>
    )
  }

  return (
    <>
      {showTeamMembers && record.winnerTeam ? (
        <div className={rawStyle} onClick={() => setShowTeamMembers(false)}>
          <div className={recordAreaStyle + ' justify-center'}>
            {/*<span className={roundTextStyle}>{index + 1} Round</span>*/}
            <span className={teamStyle}>{renderMembers(record.winnerTeam?.member)}</span>
            {/*<span className={teamStyle + ' text-[14px]'}>{record.winnerTeam?.member.join(' ')}</span>*/}
            <span className={winStyle + ' top-[0px] text-goal dark:text-blue-300'}>{record.winnerTeam.number.length === 1 ? '+ 3' : '+ 1'}</span>
          </div>
        </div>
      ) : (
        <div className={rawStyle} key={index} onClick={() => {
          if (record.winnerTeam) setShowTeamMembers(true)
        }}>
          <div className={recordAreaStyle}>
            {!editTeamMode && (
              <div className={'flex gap-2'}>
                <span className={roundTextStyle}>{(record.index ?? index) + 1} 라운드</span>
                {/*{record.winnerTeam && <div className={'flex gap-1 relative bottom-[3px]'}><span className={'text-blue-800'}>{record.winnerTeam}팀</span><span className={'text-goal'}>Win</span></div>}*/}
              </div>
            )}
            {record.winnerTeam ? (
              <div className={winnerDivStyle}>
                {endedRoundDisplay.winner && <span className={teamStyle}>{endedRoundDisplay.winner}팀 승</span>}
                {record.winnerTeam.number.length !== 1 && <span className={winStyle + ' text-blueSignature dark:text-yellow-400'}>무승부</span>}
                {endedRoundDisplay.opponents.length > 0 && (
                  <span className={opponentStyle}>vs {endedRoundDisplay.opponents.map((team) => `${team}팀`).join(', ')}</span>
                )}
                {!endedRoundDisplay.winner && endedRoundDisplay.teamList.length > 0 && (
                  <span className={opponentStyle}>{endedRoundDisplay.teamList.map((team) => `${team}팀`).join(' vs ')}</span>
                )}
                {scoreText && (
                  <span className={scoreStyle + ' ml-2'} aria-label={scoreLabel}>
                    {scoreText}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {record?.teamList?.length === 2 &&
                  (!editTeamMode ? (
                    <div className={teamStyle + ' whitespace-nowrap'} onClick={(event) => {
                      event.stopPropagation()
                      if (canEditRound) setEditTeamMode(true)
                    }}>
                      {record.teamList[0]}팀 <span className={'text-goal'}>vs</span> {record.teamList[1]}팀
                    </div>
                  ) : (
                    <div className={'flex items-center gap-2'} onClick={(event) => event.stopPropagation()}>
                      <select className={'border-2 border-gray-400 rounded-md px-2 py-1'} value={teamA} onChange={(e) => setTeamA(e.target.value)}>
                        {optionsForA.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}팀
                          </option>
                        ))}
                      </select>

                      <span>vs</span>

                      <select className={'border-2 border-gray-400 rounded-md px-2 py-1'} value={teamB} onChange={(e) => setTeamB(e.target.value)}>
                        {optionsForB.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}팀
                          </option>
                        ))}
                      </select>
                      <button
                        className={'border-2 border-red-400 flex items-center text-sm whitespace-nowrap px-3 py-2'}
                        type="button"
                        onClick={cancelEditTeamMode}
                      >
                        취소
                      </button>
                      <button
                        className={'border-2 border-green-400 flex items-center text-sm whitespace-nowrap px-3 py-2'}
                        type="button"
                        onClick={() => updateTeamListHandler(record.id)}
                      >
                        확인
                      </button>
                    </div>
                  ))}
                {!editTeamMode && scoreText && (
                  <span className={scoreStyle} aria-label={scoreLabel}>
                    {scoreText}
                  </span>
                )}
                {!editTeamMode && canEditRound && (
                  <div className={roundExitButtonStyle + ' shrink-0 whitespace-nowrap'} onClick={(event) => {
                    event.stopPropagation()
                    exitRoundHandler(record.id)
                  }}>
                    <div className={'relative left-2 text-[16px] border-2 border-red-600 rounded px-2'}>
                      <span>종료</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!editTeamMode && (
            <div className={'flex relative shrink-0 pr-3'}>
              <TimeText text={record.time.slice(0, 5)} />
            </div>
          )}
          {/*{!editTeamMode && (*/}
          {/*  <span*/}
          {/*    className={itemStyle + arrowIcon + ' shrink-0'}*/}
          {/*    onClick={() => !fakeRow && roundShowHandler(index)}*/}
          {/*  />*/}
          {/*)}*/}
        </div>
      )}
    </>
  )
}

export default RecordRow
