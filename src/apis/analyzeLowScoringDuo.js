export const analyzeLowScoringDuo = (quarterGoals, weeklyTeams, members, year, month) => {
  if (!Array.isArray(quarterGoals) || !Array.isArray(weeklyTeams) || !Array.isArray(members)) return null
  if (!Number.isInteger(month) || month < 1 || month > 12) return null

  const quarter = Math.ceil(month / 3)
  const resolveMember = (name) => {
    if (typeof name !== 'string' || !name.trim() || name.includes('용병')) return null
    if (members.includes(name)) return name
    const matches = members.filter((member) => member.includes(name))
    return matches.length === 1 ? matches[0] : null
  }

  const pointsByDate = new Map(quarterGoals.map(([date, goals]) => {
    const points = new Map()
    for (const goal of goals) {
      for (const name of [goal.goal, goal.assist]) {
        const member = resolveMember(name)
        if (member) points.set(member, (points.get(member) || 0) + 1)
      }
    }
    return [date, points]
  }))

  const pairs = new Map()
  for (const entry of weeklyTeams) {
    if (!/^\d{6}$/.test(entry?.id || '') || entry.id.slice(0, 2) !== String(year).slice(-2)) continue
    const date = entry.id.slice(2)
    const recordMonth = Number(date.slice(0, 2))
    const recordDay = Number(date.slice(2, 4))
    if (recordMonth < 1 || recordMonth > 12 || recordDay < 1 || recordDay > 31 ||
      Math.ceil(recordMonth / 3) !== quarter) continue

    const dayPoints = pointsByDate.get(date)
    for (const roster of Object.values(entry.data || {})) {
      if (!Array.isArray(roster)) continue
      const players = [...new Set(roster.map(resolveMember).filter(Boolean))].sort()
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const key = `${players[i]}\u0000${players[j]}`
          const stat = pairs.get(key) || { players: [players[i], players[j]], sharedDays: 0, points: 0 }
          stat.sharedDays++
          stat.points += (dayPoints?.get(players[i]) || 0) + (dayPoints?.get(players[j]) || 0)
          pairs.set(key, stat)
        }
      }
    }
  }

  const ranked = [...pairs.values()].filter(({ sharedDays }) => sharedDays >= 2).sort((a, b) =>
    a.points / a.sharedDays - b.points / b.sharedDays ||
    b.sharedDays - a.sharedDays ||
    a.players.join(' - ').localeCompare(b.players.join(' - '), 'ko'),
  )
  if (ranked.length === 0) return null

  const best = ranked[0]
  return {
    pairs: ranked.filter((pair) =>
      pair.points * best.sharedDays === best.points * pair.sharedDays &&
      pair.sharedDays === best.sharedDays,
    ),
    pointsPerDay: best.points / best.sharedDays,
  }
}
