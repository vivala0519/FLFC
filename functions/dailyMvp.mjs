import { createRecordMemberResolver, formatDailyRecordStats, getRegularRoundGoals } from './matchStats.mjs'
import { analyzeCleanSheets } from './goalkeeperStats.mjs'

export const selectDailyMvp = ({ weeklyTeam, rounds, memberInfo, members, oneCharacterMembers = [], nicknames = {}, year, mmdd }) => {
  const resolveMember = createRecordMemberResolver(members, oneCharacterMembers, nicknames)
  const completedRounds = rounds.filter((round) =>
    Array.isArray(round?.winnerTeam?.number) && [1, 2].includes(round.winnerTeam.number.length),
  )
  const regularGoals = completedRounds.flatMap((round) =>
    getRegularRoundGoals(round)
      .filter(([, goal]) => typeof goal?.goal === 'string' && goal.goal.trim())
      .map(([id, goal]) => ({ ...goal, id })),
  )
  const regularStats = formatDailyRecordStats(weeklyTeam, regularGoals, completedRounds, resolveMember)
  const cleanSheets = analyzeCleanSheets({
    roundYears: { [year]: { [`${mmdd}_rounds`]: completedRounds } }, weeklyTeams: [weeklyTeam],
    memberInfo, members, oneCharacterMembers, nicknames,
    asOfDate: `${year}-${mmdd.slice(0, 2)}-${mmdd.slice(2, 4)}`,
  }).totals
  const candidates = Object.entries(regularStats).map(([name, stats]) => {
    const goal = stats['골']
    const assist = stats['어시']
    const cleanSheetCount = cleanSheets.get(name) || 0
    // Integer weights keep field/goalkeeper ties exact before converting to points.
    return { name, goal, assist, cleanSheets: cleanSheetCount, score: ((goal + assist) * 2 + cleanSheetCount * 3) / 2 }
  })
  const maximum = Math.max(0, ...candidates.map(({ score }) => score))
  return maximum > 0 ? candidates.filter(({ score }) => score === maximum) : []
}
