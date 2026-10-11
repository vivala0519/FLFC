export const analyzeLowScoringDuo = (quarterGoals, weeklyTeams, members, year, month, memberInfo = {}) => {
  if (!Array.isArray(quarterGoals) || !Array.isArray(weeklyTeams) || !Array.isArray(members)) return null
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  if (!memberInfo) return null

  const quarter = Math.ceil(month / 3)
  const resolveMember = (name) => {
    if (typeof name !== 'string' || !name.trim() || name.includes('용병')) return null
    if (members.includes(name)) return name
    const matches = members.filter((member) => member.includes(name))
    return matches.length === 1 ? matches[0] : null
  }

  const goalsByDate = new Map(quarterGoals.map(([date, goals]) => {
    const combinations = new Map()
    for (const goal of goals) {
      const scorer = resolveMember(goal.goal)
      const assistant = resolveMember(goal.assist)
      if (!scorer || !assistant || scorer === assistant) continue
      const key = [scorer, assistant].sort().join('\u0000')
      combinations.set(key, (combinations.get(key) || 0) + 1)
    }
    return [date, combinations]
  }))

  const pairs = new Map()
  const sharedPairDates = new Set()
  for (const entry of weeklyTeams) {
    if (!/^\d{6}$/.test(entry?.id || '') || entry.id.slice(0, 2) !== String(year).slice(-2)) continue
    const date = entry.id.slice(2)
    const recordMonth = Number(date.slice(0, 2))
    const recordDay = Number(date.slice(2, 4))
    if (recordMonth < 1 || recordMonth > 12 || recordDay < 1 || recordDay > 31 ||
      Math.ceil(recordMonth / 3) !== quarter) continue

    const dayGoals = goalsByDate.get(date)
    for (const roster of Object.values(entry.data || {})) {
      if (!Array.isArray(roster)) continue
      const players = [...new Set(roster.map(resolveMember).filter((member) => member
        && memberInfo[member]?.goalKeeper !== true && memberInfo[member]?.goalkeeper !== true))].sort()
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const key = `${players[i]}\u0000${players[j]}`
          const sharedDateKey = `${date}\u0000${key}`
          if (sharedPairDates.has(sharedDateKey)) continue
          sharedPairDates.add(sharedDateKey)
          const stat = pairs.get(key) || { players: [players[i], players[j]], sharedDays: 0, goals: 0 }
          stat.sharedDays++
          stat.goals += dayGoals?.get(key) || 0
          pairs.set(key, stat)
        }
      }
    }
  }

  const ranked = [...pairs.values()].filter(({ sharedDays }) => sharedDays >= 2).sort((a, b) =>
    a.goals / a.sharedDays - b.goals / b.sharedDays ||
    b.sharedDays - a.sharedDays ||
    a.players.join(' - ').localeCompare(b.players.join(' - '), 'ko'),
  )
  if (ranked.length === 0) return null

  const best = ranked[0]
  return {
    pairs: ranked.filter((pair) =>
      pair.goals * best.sharedDays === best.goals * pair.sharedDays &&
      pair.sharedDays === best.sharedDays,
    ),
    goalsPerDay: best.goals / best.sharedDays,
  }
}
