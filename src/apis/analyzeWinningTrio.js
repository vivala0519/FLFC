// A trio's win rate is its wins divided by all completed rounds played together.
export const analyzeWinningTrio = (yearData, weeklyTeams, members, year, month) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  if (!Array.isArray(weeklyTeams) || !Array.isArray(members)) return null

  const quarter = Math.ceil(month / 3)
  const teamByDate = new Map(weeklyTeams.map((entry) => [entry.id, entry.data]))
  const trioStats = new Map()
  const pairKey = (first, second) => [first, second].sort().join('\u0000')
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

    const teams = teamByDate.get(`${String(year).slice(-2)}${date}`)
    if (!teams) continue
    for (const round of Object.values(rounds || {})) {
      const playingTeams = Array.isArray(round?.teamList)
        ? [...new Set(round.teamList.map(String))] : []
      const winners = Array.isArray(round?.winnerTeam?.number)
        ? [...new Set(round.winnerTeam.number.map(String))] : []
      if (playingTeams.length !== 2 ||
        ![1, 2].includes(winners.length) ||
        !winners.every((team) => playingTeams.includes(team))) continue

      for (const team of playingTeams) {
        const roster = teams[team]
        if (!Array.isArray(roster)) continue
        const players = [...new Set(roster.map(resolveMember).filter(Boolean))].sort()
        const playerSet = new Set(players)
        const pairGoals = new Map()
        for (const [id, goal] of Object.entries(round.goal || {})) {
          if (id === 'fever-time-bar' || goal?.id === 'fever-time-bar') continue
          const scorer = resolveMember(goal?.goal)
          const assistant = resolveMember(goal?.assist)
          if (!scorer || !assistant || scorer === assistant ||
            !playerSet.has(scorer) || !playerSet.has(assistant)) continue
          const key = pairKey(scorer, assistant)
          pairGoals.set(key, (pairGoals.get(key) || 0) + 1)
        }
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            for (let k = j + 1; k < players.length; k++) {
              const trio = [players[i], players[j], players[k]]
              const key = trio.join('\u0000')
              const stat = trioStats.get(key) || {
                players: trio, wins: 0, games: 0, attackPoints: 0,
              }
              stat.games++
              if (winners.length === 1 && winners[0] === team) stat.wins++
              stat.attackPoints += (pairGoals.get(pairKey(players[i], players[j])) || 0) +
                (pairGoals.get(pairKey(players[j], players[k])) || 0) +
                (pairGoals.get(pairKey(players[i], players[k])) || 0)
              trioStats.set(key, stat)
            }
          }
        }
      }
    }
  }

  const ranked = [...trioStats.values()].filter((stat) => stat.wins > 0)
  ranked.sort((a, b) =>
    b.wins / b.games - a.wins / a.games ||
    b.attackPoints - a.attackPoints ||
    b.games - a.games ||
    a.players.join(' - ').localeCompare(b.players.join(' - '), 'ko'),
  )
  if (ranked.length === 0) return null
  const best = ranked[0]
  return { ...best, winRate: best.wins / best.games }
}
