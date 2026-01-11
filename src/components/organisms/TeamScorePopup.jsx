import { useEffect, useState } from 'react'
import { getDatabase, ref, remove } from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'

const TeamScorePopup = (props) => {
  const {
    time: { today, thisYear },
  } = getTimes()
  const { setShowMVP, recordData, weeklyTeamData } = props
  const [teamScore, setTeamScore] = useState({'1': {}, '2': {}, '3': {}})

  const popupContainerStyle =
    'w-[100%] h-[150px] bg-white dark:text-black cursor-pointer border-gray-200 border-4 flex flex-col desktop:w-[30%] flex gap-2 items-center justify-center'

  useEffect(() => {
    const run = async () => {
      const stats = {}

      // 마지막 경기 안한 라운드 체크 & 삭제
      const lastRound = recordData[recordData.length - 1]
      if (!lastRound.goals || lastRound?.goals?.length === 0) {
        const toSeconds = (t) => {
          const [h, m, s = '0'] = t.split(':')
          return Number(h) * 3600 + Number(m) * 60 + Number(s)
        }
        const targetTime = '09:55:00'
        if (toSeconds(lastRound.time) >= toSeconds(targetTime)) {
          const getRoundRef = (db, thisYear, today, roundId) =>
            ref(db, `${thisYear}/${today}_rounds/${roundId}`)
          const db = getDatabase()
          const lastRoundRef = getRoundRef(db, thisYear, today, lastRound.id)
          await remove(lastRoundRef)
        }
      }
      console.log(recordData)

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
    }

    run()

    }, [recordData])

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