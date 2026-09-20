import { useEffect, useState } from 'react'
import { getDatabase, ref, runTransaction } from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'
import { finalizeRound } from '@/apis/finalizeRound.js'

const TeamScorePopup = (props) => {
  const { time: { today, thisYear } } = getTimes()
  const { setShowMVP, recordData, weeklyTeamData, showMVP } = props
  const [teamScore, setTeamScore] = useState({'1': {}, '2': {}, '3': {}})

  const popupContainerStyle =
    'w-[100%] h-[150px] bg-white dark:text-black cursor-pointer border-gray-200 border-4 flex flex-col desktop:w-[30%] flex gap-2 items-center justify-center'

  useEffect(() => {
    const lastRound = recordData[recordData.length - 1]
    if (!showMVP || !lastRound || lastRound.winnerTeam) return
    const roundId = lastRound.roundId || lastRound.id
    if (!roundId) return

    const db = getDatabase()
    const lastRoundRef = ref(db, `${thisYear}/${today}_rounds/${roundId}`)
    runTransaction(
      lastRoundRef,
      (currentRound) => finalizeRound(currentRound, weeklyTeamData),
      { applyLocally: false },
    ).catch((error) => {
      console.error('Failed to finalize last round:', error)
    })
  }, [recordData, showMVP, weeklyTeamData, thisYear, today])

  useEffect(() => {
    if (!showMVP) return
    const stats = {}

    recordData.forEach((rec) => {
      // 각 팀 스탯 분배
      const winnerTeam = rec.winnerTeam
      const lostTeam = rec.lostTeam
      if (!winnerTeam || !Array.isArray(winnerTeam.number)) return

      const teamNumbers = winnerTeam.number.map(String)

      if (teamNumbers.length === 1) {
        // 1승 추가
        const team = teamNumbers[0]
        if (!stats[team]) stats[team] = { win: 0, draw: 0, lost: 0 }
        stats[team].win += 1
      } else if (teamNumbers.length === 2) {
        // 각 팀 1무 추가
        teamNumbers.forEach((team) => {
          if (!stats[team]) stats[team] = { win: 0, draw: 0, lost: 0 }
          stats[team].draw += 1
        })
      }
      if (lostTeam) {
        if (!stats[lostTeam]) stats[lostTeam] = { win: 0, draw: 0, lost: 0 }
        stats[lostTeam].lost += 1
      }
    })

    // 1,2,3팀 기본값 보장 (없으면 0으로 채우기)
    ;['1', '2', '3'].forEach((team) => {
      if (!stats[team]) stats[team] = { win: 0, draw: 0, lost: 0 }
    })
    setTeamScore(stats)
  }, [recordData, showMVP])

  return (
    <div className={popupContainerStyle} onClick={() => setShowMVP(false)}>
      <span>팀 통계</span>
      <div className={'flex gap-2'}>
        <span>1팀:</span>
        <span>
          {teamScore['1']?.win +
            '승 ' +
            teamScore['1']?.draw +
            '무 ' +
            teamScore['1']?.lost +
            '패'
          }
        </span>
      </div>
      <div className={'flex gap-2'}>
        <span>2팀:</span>
        <span>
          {teamScore['2']?.win +
            '승 ' +
            teamScore['2']?.draw +
            '무 ' +
            teamScore['2']?.lost +
            '패'
          }
        </span>
      </div>
      {weeklyTeamData?.data['3'][0] && (
        <div className={'flex gap-2'}>
          <span>3팀:</span>
          <span>
            {teamScore['3']?.win +
              '승 ' +
              teamScore['3']?.draw +
              '무 ' +
              teamScore['3']?.lost +
              '패'
            }
          </span>
        </div>
      )}
    </div>
  )
}

export default TeamScorePopup
