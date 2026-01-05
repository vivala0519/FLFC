import TimeText from '@/components/atoms/Text/TimeText.jsx'
import Swal from 'sweetalert2'
import { get, getDatabase, ref, set, update } from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'
import { useEffect, useState } from 'react'

const RecordRow = (props) => {
  const { time: { today, thisYear, currentTime } } = getTimes()
  const {
    record,
    index,
    fakeRow,
    isOpen,
    roundShowHandler,
    weeklyTeamData,
    setShowSelectTeamPopup,
    setPendingRoundId,
    setSelectTeamPopupMessage,
    setShowSelectScorerTeamPopup,
    setSelectScorerTeamPopupMessage,
    setPopupType,
    setPlayingTeams,
  } = props
  const ALL_TEAMS = ['1', '2', '3']
  const [showTeamMembers, setShowTeamMembers] = useState(false)
  const [editTeamMode, setEditTeamMode] = useState(false)
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const rawStyle = `relative flex items-center justify-between mobile:justify-normal w-[85%] gap-5 py-1`
  const recordAreaStyle = 'flex items-center font-dnf-forged gap-2 w-full'
  const roundTextStyle = 'text-[13px] text-black dark:text-gray-100'
  const winnerDivStyle = 'flex items-center relative bottom-[2px]'
  const teamStyle = 'font-dnf-forged text-teamWin dark:text-blue-300 mr-1 text-sm'
  const winStyle = 'font-hahmlet text-goal dark:text-red-300 text-sm'
  const itemStyle = `w-[35px] h-[25px] bg-[length:100%_100%] ${!isOpen ? 'rotate-180' : 'rotate-0'} `
  const arrowIcon = 'bg-[url("@/assets/up2.png")] '
  const roundExitButtonStyle = 'text-goal dark:text-red-500 animate-pulse'


  const optionsForA = ALL_TEAMS.filter((opt) => opt !== teamB)
  const optionsForB = ALL_TEAMS.filter((opt) => opt !== teamA)

  useEffect(() => {
    if (record?.teamList?.length === 2) {
      setTeamA(record.teamList[0])
      setTeamB(record.teamList[1])
    }
  }, [record?.teamList])

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
    }

    await set(roundRef, roundData)
    return newRoundId
  }

  const selectWinnerTeam = async () => {
    const roundId = await createRound()
    setPendingRoundId(roundId)
    setSelectTeamPopupMessage('첫 라운드 어느 팀이 경기했나요?')
    setShowSelectTeamPopup(true)
  }

  const exitRound = async (roundId) => {
    const db = getDatabase()
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    const snap = await get(roundRef)
    const roundData = snap.val() || {}
    const mostGetGoalTeam = getMostFrequentElements(roundData.getGoalTeam || [])
    // 한골
    if (mostGetGoalTeam.length === 1) {
      await update(roundRef, {
        winnerTeam: {
          number: [mostGetGoalTeam[0]],
          member: weeklyTeamData.data[String(mostGetGoalTeam[0])],
        },
        lostTeam: roundData.teamList.find((team) => team !== String(mostGetGoalTeam[0]),
        ),
      })
      const newRoundId = await createRound()
      const restTeam = ALL_TEAMS.find((team) => !roundData.teamList.includes(String(team)))
      const nextTeamList = [restTeam, String(mostGetGoalTeam[0])]
      const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)
      await update(newRoundRef, {teamList: nextTeamList})
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
        await update(roundRef, {
          winnerTeam: {
            number: roundData.teamList,
            member: weeklyTeamData.data[String(roundData.teamList[0])].concat(
              weeklyTeamData.data[String(roundData.teamList[1])],
            ),
          },
        })
        const newRoundId = await createRound()
        const restTeam = ALL_TEAMS.find(
          (team) => !roundData.teamList.includes(String(team)),
        )
        const nextTeamList = [restTeam, String(roundData.teamList[0])]
        const newRoundRef = getRoundRef(db, thisYear, today, newRoundId)
        await update(newRoundRef, { teamList: nextTeamList })
      }
    }
  }

  const exitRoundHandler = async (roundId) => {
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
        exitRound(roundId)
      }
    })
  }

  const cancelEditTeamMode = () => {
    setTeamA(record.teamList[0])
    setTeamB(record.teamList[1])
    setEditTeamMode(false)
  }

  const updateTeamListHandler = async (roundId) => {
    if (teamA === record.teamList[0] && teamB === record.teamList[1]) {
      setEditTeamMode(false)
      return
    }
    const db = getDatabase()
    const roundRef = getRoundRef(db, thisYear, today, roundId)
    await update(roundRef, {teamList: [teamA, teamB], updated: true})
    setEditTeamMode(false)
  }

  const renderMembers = (members = []) => {
    if (!Array.isArray(members) || members.length === 0) return null

    if (members.length <= 6) {
      return members.join(' ')
    }

    const firstLine = members.slice(0, 6).join(' ')
    const secondLine = members.slice(6).join(' ')

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
      {showTeamMembers ? (
        <div className={rawStyle} onClick={() => setShowTeamMembers(false)}>
          <div className={recordAreaStyle + ' justify-center'}>
            {/*<span className={roundTextStyle}>{index + 1} Round</span>*/}
            <span className={teamStyle + ' text-[14px]'}>
              {renderMembers(record.winnerTeam?.member)}
            </span>
            {/*<span className={teamStyle + ' text-[14px]'}>{record.winnerTeam?.member.join(' ')}</span>*/}
            <span className={winStyle + ' relative bottom-[2px]'}>
              {record.winnerTeam.number.length === 1 ? '+ 3' : '+ 1'}
            </span>
          </div>
        </div>
      ) : (
        <div className={rawStyle} key={index}>
          <div className={recordAreaStyle}>
            {!editTeamMode && (
              <div className={'flex gap-2'}>
                <span className={roundTextStyle}>{index + 1} Round</span>
                {/*{record.winnerTeam && <div className={'flex gap-1 relative bottom-[3px]'}><span className={'text-blue-800'}>{record.winnerTeam}팀</span><span className={'text-goal'}>Win</span></div>}*/}
              </div>
            )}
            {record.winnerTeam ? (
              <div
                className={winnerDivStyle}
                onClick={() => setShowTeamMembers(true)}
              >
                {record.winnerTeam.number.length === 1 && (
                  <span className={teamStyle}>
                    {record.winnerTeam.number}팀{' '}
                  </span>
                )}
                <span className={winStyle}>
                  {record.winnerTeam.number.length === 1 ? 'Win' : 'Draw'}
                </span>
              </div>
              ) :
              <>
                {record?.teamList?.length === 2 &&
                  (!editTeamMode ? (
                    <div
                      className={teamStyle}
                      onClick={() => setEditTeamMode(true)}
                    >
                      {record.teamList[0]}팀{' '}
                      <span className={'text-assist'}>vs</span>{' '}
                      {record.teamList[1]}팀
                    </div>
                  ) : (
                    <div className={'flex items-center gap-2'}>
                      <select
                        className={
                          'border-2 border-gray-400 rounded-md px-2 py-1'
                        }
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                      >
                        {optionsForA.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}팀
                          </option>
                        ))}
                      </select>

                      <span>vs</span>

                      <select
                        className={
                          'border-2 border-gray-400 rounded-md px-2 py-1'
                        }
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                      >
                        {optionsForB.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}팀
                          </option>
                        ))}
                      </select>
                      <button
                        className={
                          'border-2 border-red-400 flex items-center text-sm whitespace-nowrap px-3 py-2'
                        }
                        type="button"
                        onClick={cancelEditTeamMode}
                      >
                        취소
                      </button>
                      <button
                        className={
                          'border-2 border-green-400 flex items-center text-sm whitespace-nowrap px-3 py-2'
                        }
                        type="button"
                        onClick={() => updateTeamListHandler(record.id)}
                      >
                        확인
                      </button>
                    </div>
                  ))}
                {!editTeamMode && (
                  <div
                    className={roundExitButtonStyle}
                    onClick={() => exitRoundHandler(record.id)}
                  >
                    <div className={''}>
                      <span>종료</span>
                    </div>
                  </div>
                )}
              </>
            }
          </div>
          {!editTeamMode && (
            <div className={'flex bottom-[1px] '}>
              <TimeText text={record.time.slice(0, 5)} />
            </div>
          )}
          {!editTeamMode && (
            <span
              className={itemStyle + arrowIcon}
              onClick={() => !fakeRow && roundShowHandler(index)}
            />
          )}
        </div>
      )}
    </>
  )
}

export default RecordRow