import { getRoundParticipants } from './roundParticipants.js'

// RTDB transactions use undefined to abort and null to delete the round.
export const finalizeRound = (round, weeklyTeamData) => {
  if (!round || round.winnerTeam) return

  const time = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(round.time || '')
  if (!time) return
  const [, hours, minutes, seconds = '0'] = time
  if (hours > 23 || minutes > 59 || seconds > 59) return
  const startTime = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)

  const goalEntries = Object.entries(round.goal || {}).filter(
    ([id, goal]) => id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar',
  )
  const recordedTeams = round.getGoalTeam ?? []
  if (!Array.isArray(recordedTeams)) return
  const goalTeams = recordedTeams.map(String)
  const noGoals = goalEntries.length === 0 && goalTeams.length === 0

  if (noGoals && startTime >= 9 * 3600 + 55 * 60) return null

  // Goal details and goal teams are saved separately; wait for both.
  if (goalEntries.length !== goalTeams.length) return
  if (!Array.isArray(round.teamList)) return
  const teamList = [...new Set(round.teamList.map(String))]
  if (teamList.length !== 2) return
  if (!teamList.every((team) => Array.isArray(weeklyTeamData?.data?.[team]))) return
  if (!goalTeams.every((team) => teamList.includes(team))) return

  const scores = teamList.map((team) => goalTeams.filter((goalTeam) => goalTeam === team).length)
  const highestScore = Math.max(...scores)
  const winners = teamList.filter((_, index) => scores[index] === highestScore)

  return {
    ...round,
    participant: getRoundParticipants(weeklyTeamData, teamList),
    winnerTeam: {
      number: winners,
      member: getRoundParticipants(weeklyTeamData, winners),
    },
    lostTeam: winners.length === 1 ? teamList.find((team) => team !== winners[0]) : false,
  }
}
