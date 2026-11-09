import { createRecordMemberResolver, getRegularRoundGoals } from './matchStats.mjs'

const roundDate = (year, key) => {
  if (!/^\d{4}$/.test(year) || Number(year) < 2026 || !/^\d{4}_rounds$/.test(key)) return null
  const month = Number(key.slice(0, 2))
  const day = Number(key.slice(2, 4))
  const date = new Date(Date.UTC(Number(year), month - 1, day))
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null
  return { date: `${year}-${key.slice(0, 2)}-${key.slice(2, 4)}`, quarter: Math.ceil(month / 3) }
}

const getScoringTeams = (round, teams) => {
  const goals = getRegularRoundGoals(round)
  if (goals.some(([, goal]) => typeof goal?.goal !== 'string' || !goal.goal.trim())) return null
  const explicitTeams = goals.map(([, goal]) => String(goal.team ?? ''))
  if (explicitTeams.some(Boolean)) {
    return explicitTeams.every((team) => teams.includes(team)) ? explicitTeams : null
  }

  const recorded = round.getGoalTeam ?? []
  if (!Array.isArray(recorded)) return null
  const allGoalCount = Object.entries(round.goal || {}).filter(([id, goal]) =>
    id !== 'fever-time-bar' && goal?.id !== 'fever-time-bar',
  ).length
  // Older fever rounds also appended fever teams; only the regular prefix counts.
  if (recorded.length < goals.length || recorded.length > allGoalCount) return null
  const scoringTeams = recorded.slice(0, goals.length).map(String)
  return scoringTeams.every((team) => teams.includes(team)) ? scoringTeams : null
}

const goalSeconds = (time) => {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(time || '')
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0) : null
}

const matchGoalsToTeams = (round, scoringTeams) => {
  const goals = getRegularRoundGoals(round)
  if (goals.some(([, goal]) => String(goal.team ?? '') !== '')) {
    return goals.map(([, goal], index) => ({ goal, team: scoringTeams[index] }))
  }
  // Firebase object keys are not event order; legacy team arrays follow goal times.
  if (goals.length > 1 && goals.some(([, goal]) => goalSeconds(goal.time) === null)) return []
  const ordered = [...goals].sort(([firstId, first], [secondId, second]) =>
    (goalSeconds(first.time) ?? 0) - (goalSeconds(second.time) ?? 0) || firstId.localeCompare(secondId),
  )
  if (ordered.some(([, goal], index) => index > 0 &&
    goalSeconds(goal.time) === goalSeconds(ordered[index - 1][1].time) &&
    scoringTeams[index] !== scoringTeams[index - 1])) return []
  return ordered.map(([, goal], index) => ({ goal, team: scoringTeams[index] }))
}

export const analyzeCleanSheets = ({ roundYears, weeklyTeams, memberInfo, members = [], oneCharacterMembers = [], nicknames = {}, asOfDate }) => {
  const goalkeepers = Object.entries(memberInfo || {})
    .filter(([, info]) => info?.goalKeeper === true || info?.goalkeeper === true)
    .map(([name]) => name)
  const resolveMember = createRecordMemberResolver(
    [...new Set([...members, ...Object.keys(memberInfo || {})])], oneCharacterMembers, nicknames,
  )
  const resolveRoster = (roster) => new Set((Array.isArray(roster) ? roster : []).map(resolveMember).filter(Boolean))
  const weeklyByDate = new Map((Array.isArray(weeklyTeams) ? weeklyTeams : []).map(({ id, data }) => [id, data]))
  const totals = new Map(goalkeepers.map((name) => [name, 0]))
  const seasons = new Map()
  const careerHigh = new Map()
  const dailyCounts = new Map()
  const dailyHigh = new Map(goalkeepers.map((name) => [name, 0]))
  const concededTotals = new Map(goalkeepers.map((name) => [name, new Map()]))
  const concededSeasons = new Map()

  for (const [year, yearData] of Object.entries(roundYears || {})) {
    for (const [key, rounds] of Object.entries(yearData || {})) {
      const period = roundDate(year, key)
      if (!period || (asOfDate && period.date > asOfDate)) continue
      const weeklyTeam = weeklyByDate.get(`${year.slice(-2)}${key.slice(0, 4)}`) || {}
      for (const round of Object.values(rounds || {})) {
        const teams = Array.isArray(round?.teamList) ? [...new Set(round.teamList.map(String))] : []
        const winners = Array.isArray(round?.winnerTeam?.number) ? [...new Set(round.winnerTeam.number.map(String))] : []
        if (teams.length !== 2 || ![1, 2].includes(winners.length) || !winners.every((team) => teams.includes(team))) continue
        const scoringTeams = getScoringTeams(round, teams)
        if (scoringTeams === null) continue
        const scoredGoals = matchGoalsToTeams(round, scoringTeams)

        const rosters = new Map(teams.map((team) => [team, resolveRoster(weeklyTeam[team])]))
        const winningMembers = resolveRoster(round.winnerTeam.member)
        const hasParticipants = Array.isArray(round.participant) && round.participant.length > 0
        const participants = hasParticipants ? resolveRoster(round.participant)
          : new Set([...rosters.values()].flatMap((roster) => [...roster]).concat([...winningMembers]))

        for (const name of goalkeepers) {
          if (!participants.has(name)) continue
          const rosterTeams = teams.filter((team) => rosters.get(team).has(name))
          // A recorded winning roster retains borrowed players even if the weekly team differs.
          const recordedTeam = winners.length === 1 && winningMembers.size > 0
            ? winningMembers.has(name) ? winners[0]
              : hasParticipants ? teams.find((number) => number !== winners[0]) : null
            : null
          const team = recordedTeam || (rosterTeams.length === 1 ? rosterTeams[0] : null)
          // A scoreless draw is certain even when an old participant's team is unknown.
          if (!team && scoringTeams.length > 0) continue
          const seasonKey = `${year}-${period.quarter}`
          const counts = seasons.get(seasonKey) || new Map()
          const dayCounts = dailyCounts.get(period.date) || new Map()
          if (!counts.has(name)) counts.set(name, 0)
          if (!scoringTeams.some((number) => number !== team)) {
            totals.set(name, totals.get(name) + 1)
            counts.set(name, counts.get(name) + 1)
            dayCounts.set(name, (dayCounts.get(name) || 0) + 1)
            dailyHigh.set(name, Math.max(dailyHigh.get(name), dayCounts.get(name)))
          }
          seasons.set(seasonKey, counts)
          dailyCounts.set(period.date, dayCounts)

          for (const event of scoredGoals) {
            if (event.team === team) continue
            const scorer = resolveMember(event.goal.goal)
            if (!scorer) continue
            const totalCounts = concededTotals.get(name)
            totalCounts.set(scorer, (totalCounts.get(scorer) || 0) + 1)
            const seasonCounts = concededSeasons.get(seasonKey) || new Map()
            const playerCounts = seasonCounts.get(name) || new Map()
            playerCounts.set(scorer, (playerCounts.get(scorer) || 0) + 1)
            seasonCounts.set(name, playerCounts)
            concededSeasons.set(seasonKey, seasonCounts)
          }
        }
      }
    }
  }

  // Visit the latest season first so tied career highs follow the existing record convention.
  for (const [season, counts] of [...seasons].sort(([a], [b]) => b.localeCompare(a))) {
    const [year, quarter] = season.split('-')
    for (const [name, count] of counts) {
      if (!careerHigh.has(name) || count > careerHigh.get(name).value) {
        careerHigh.set(name, { value: count, season: `${year}년 ${quarter}분기` })
      }
    }
  }
  return { totals, seasons, careerHigh, dailyHigh, concededTotals, concededSeasons }
}
