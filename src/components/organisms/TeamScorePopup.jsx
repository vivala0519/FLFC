import { useEffect, useState } from 'react'
import { getDatabase, ref, update, remove } from 'firebase/database'
import getTimes from '@/hooks/getTimes.js'

const TeamScorePopup = (props) => {
  const {
    time: { today, thisYear },
  } = getTimes()
  const { setShowMVP, recordData, weeklyTeamData, showMVP } = props
  const [teamScore, setTeamScore] = useState({'1': {}, '2': {}, '3': {}})

  const popupContainerStyle =
    'w-[100%] h-[150px] bg-white dark:text-black cursor-pointer border-gray-200 border-4 flex flex-col desktop:w-[30%] flex gap-2 items-center justify-center'

  useEffect(() => {
    const run = async () => {
      const stats = {}
      const toSeconds = (t) => {
        const [h, m, s = '0'] = t.split(':')
        return Number(h) * 3600 + Number(m) * 60 + Number(s)
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


      const lastRound = recordData[recordData.length - 1]
      const getRoundRef = (db, thisYear, today, roundId) =>
        ref(db, `${thisYear}/${today}_rounds/${roundId}`)
      const db = getDatabase()
      if (lastRound) {
        const lastRoundRef = getRoundRef(db, thisYear, today, lastRound.id)
        // 마지막 경기 종료 안됐으면 종료
        if (!lastRound.winnerTeam) {
          const targetTime = "09:54:00"
          if (toSeconds(lastRound.time) <= toSeconds(targetTime)) {
            const mostGetGoalTeam = getMostFrequentElements(
                lastRound.getGoalTeam || [],
            )
            await update(lastRoundRef, {
              winnerTeam: {
                number: mostGetGoalTeam,
                member:
                    mostGetGoalTeam.length === 1
                        ? weeklyTeamData.data[String(mostGetGoalTeam[0])]
                        : weeklyTeamData.data[String(mostGetGoalTeam[0])].concat(
                            weeklyTeamData.data[String(mostGetGoalTeam[1])],
                        ),
              },
              lostTeam:
                  mostGetGoalTeam.length === 1 &&
                  lastRound.teamList.find(
                      (team) => team !== String(mostGetGoalTeam[0]),
                  ),
            })
          }
        }
        // 마지막 경기 안한 라운드 체크 & 삭제
        if ((lastRound && !lastRound.goals) || lastRound?.goals?.length === 0) {
          const targetTime = '09:55:00'
          if (toSeconds(lastRound.time) >= toSeconds(targetTime)) {
            await remove(lastRoundRef)
          }
        }

      }

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

    if (showMVP) {
      run()
    }

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