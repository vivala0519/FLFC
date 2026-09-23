export const analyzeStarterPointRate = (yearData, weeklyTeams, members, year, month) => {
  const empty = { early: [], late: [], playerRates: new Map() }
  if (!Number.isInteger(month) || month < 1 || month > 12) return empty
  if (!Array.isArray(weeklyTeams) || !Array.isArray(members)) return empty

  const quarter = Math.ceil(month / 3)
  const teamByDate = new Map(weeklyTeams.map(({ id, data }) => [id, data]))
  const playerStats = new Map()
  const resolveMember = (shortName) => {
    if (typeof shortName !== 'string' || !shortName.trim() || shortName.includes('용병')) return null
    if (members.includes(shortName)) return shortName
    const matches = members.filter((member) => member.includes(shortName))
    return matches.length === 1 ? matches[0] : null
  }

  for (const [dateKey, rounds] of Object.entries(yearData || {})) {
    if (!/^\d{4}_rounds$/.test(dateKey)) continue
    const date = dateKey.slice(0, 4)
    const recordMonth = Number(date.slice(0, 2))
    const recordDay = Number(date.slice(2, 4))
    if (recordMonth < 1 || recordMonth > 12 ||
      recordDay < 1 || recordDay > 31 || Math.ceil(recordMonth / 3) !== quarter) continue

    const teams = teamByDate.get(`${String(year).slice(-2)}${date}`) || {}
    for (const round of Object.values(rounds || {})) {
      const time = /^(\d{2}):([0-5]\d)(?::[0-5]\d)?$/.exec(round?.time || '')
      if (!time) continue
      const minutes = Number(time[1]) * 60 + Number(time[2])
      if (minutes < 7 * 60 + 50 || minutes >= 10 * 60) continue
      const period = minutes < 9 * 60 ? 'early' : 'late'

      const playingTeams = Array.isArray(round.teamList)
        ? [...new Set(round.teamList.map(String))] : []
      const winners = Array.isArray(round.winnerTeam?.number)
        ? [...new Set(round.winnerTeam.number.map(String))] : []
      if (playingTeams.length !== 2 || ![1, 2].includes(winners.length) ||
        !winners.every((team) => playingTeams.includes(team))) continue

      const roster = (teamList) => teamList.flatMap((team) =>
        Array.isArray(teams[team]) ? teams[team] : [],
      )
      const participants = Array.isArray(round.participant) && round.participant.length > 0
        ? round.participant : roster(playingTeams)
      const winningMembers = Array.isArray(round.winnerTeam.member) && round.winnerTeam.member.length > 0
        ? round.winnerTeam.member : roster(winners)
      const winnerNames = new Set(winningMembers.map(resolveMember).filter(Boolean))

      for (const name of new Set(participants.map(resolveMember).filter(Boolean))) {
        const points = winners.length === 2 ? 1 : winnerNames.has(name) ? 3 : 0
        const stats = playerStats.get(name) || {
          name,
          early: { points: 0, games: 0 },
          late: { points: 0, games: 0 },
        }
        stats[period].points += points
        stats[period].games++
        playerStats.set(name, stats)
      }
    }
  }

  const leaders = (period) => {
    const other = period === 'early' ? 'late' : 'early'
    const ranked = [...playerStats.values()].map((stats) => ({
      ...stats,
      rate: stats[period].games ? stats[period].points / stats[period].games : 0,
      otherRate: stats[other].games ? stats[other].points / stats[other].games : 0,
    })).filter((stats) => stats[period].games > 0 && stats.rate > stats.otherRate)
    ranked.sort((a, b) =>
      (b.rate - b.otherRate) - (a.rate - a.otherRate) || a.name.localeCompare(b.name, 'ko'),
    )
    if (ranked.length === 0) return []
    const bestDifference = ranked[0].rate - ranked[0].otherRate
    return ranked.filter((stats) =>
      Math.abs(stats.rate - stats.otherRate - bestDifference) < 1e-10,
    )
  }

  const playerRates = new Map([...playerStats].map(([name, stats]) => [name, {
    early: stats.early.games ? stats.early.points / stats.early.games : 0,
    late: stats.late.games ? stats.late.points / stats.late.games : 0,
  }]))

  return { early: leaders('early'), late: leaders('late'), playerRates }
}
