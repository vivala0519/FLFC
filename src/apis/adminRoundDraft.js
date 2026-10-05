const koreanClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function getAdminMatchContext(now) {
  const parts = Object.fromEntries(koreanClock.formatToParts(now).map(({ type, value }) => [type, value]))
  const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
  const weekday = day.getUTCDay()
  const minute = Number(parts.hour) * 60 + Number(parts.minute)
  const canEdit = weekday === 0 && minute >= 480 && minute < 600
  // Match the existing shared round subscription's date selection.
  if (weekday !== 0 && weekday !== 6) day.setUTCDate(day.getUTCDate() - weekday)
  const year = String(day.getUTCFullYear())
  const month = String(day.getUTCMonth() + 1).padStart(2, '0')
  const date = String(day.getUTCDate()).padStart(2, '0')
  return { key: `${year}${month}${date}`, weeklyTeamId: `${year.slice(-2)}${month}${date}`,
    dateLabel: `${year}.${month}.${date}`, timeLabel: `${parts.hour}:${parts.minute}:${parts.second}`, canEdit }
}

const isFeverMarker = ([id, goal]) => id === 'fever-time-bar' || goal?.id === 'fever-time-bar'

export function createAdminRoundDrafts(source = {}) {
  return Object.entries(source || {}).filter(([, round]) => round && typeof round === 'object')
    .map(([id, round]) => {
      const entries = Object.entries(round.goal || {}).sort(([idA, a], [idB, b]) =>
        String(a?.time || '').localeCompare(String(b?.time || '')) || idA.localeCompare(idB))
      const feverIndex = entries.findIndex(isFeverMarker)
      let scoreIndex = 0
      const goals = entries.flatMap(([goalId, goal], index) => {
        if (!goal || isFeverMarker([goalId, goal])) return []
        const fever = typeof goal.fever === 'boolean' ? goal.fever : feverIndex >= 0 && index > feverIndex
        const team = fever ? '' : String(goal.team ?? round.getGoalTeam?.[scoreIndex] ?? '')
        if (!fever) scoreIndex++
        return [{ id: goalId, time: goal.time || '', goal: goal.goal || '', assist: goal.assist || '',
          team, fever }]
      })
      const winners = Array.isArray(round.winnerTeam?.number) ? round.winnerTeam.number.map(String) : []
      return { id, index: Number.isFinite(Number(round.index)) ? Number(round.index) : Number(id) - 1 || 0,
        time: round.time || '', teams: Array.isArray(round.teamList) ? round.teamList.map(String) : [],
        result: winners.length === 2 ? 'draw' : winners[0] || 'playing', goals }
    }).sort((a, b) => a.index - b.index || a.id.localeCompare(b.id))
}

export function getAdminRoundScores(round) {
  return round.teams.map((team) => round.goals.filter((goal) => !goal.fever && goal.team === team).length)
}

export const getAdminRoundResult = (round) => round.result === 'playing' ? '진행중'
  : round.result === 'draw' ? '무승부' : `${round.result}팀 승`

export function validateAdminGoal(goal, round) {
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(goal.time)) return '기록 시간을 확인해주세요.'
  if (!goal.goal.trim()) return '득점자를 입력해주세요.'
  if (!goal.fever && !round.teams.includes(goal.team)) return '득점 팀을 선택해주세요.'
  if (goal.assist.trim() && goal.goal.trim() === goal.assist.trim()) return '득점자와 도움 선수가 같아요.'
  return ''
}

export function createAdminRound(rounds, teams, time = '08:00:00') {
  const index = rounds.length ? Math.max(...rounds.map((round) => round.index)) + 1 : 0
  return { id: String(index + 1).padStart(2, '0'), index, time, teams: teams.slice(0, 2), result: 'playing', goals: [] }
}
