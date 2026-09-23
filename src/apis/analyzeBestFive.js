const numberOrZero = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const byName = (a, b) => a.name.localeCompare(b.name, 'ko')

// Reserve GK for the highest-point registered goalkeeper with quarter records.
export const analyzeBestFive = (records, memberInfo, month) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  const quarter = Math.ceil(month / 3)
  const totals = new Map()

  for (const record of records || []) {
    if (!/^\d{4}$/.test(record?.id) ||
      Math.ceil(Number(record.id.slice(0, 2)) / 3) !== quarter ||
      !record.data || typeof record.data !== 'object') continue

    for (const [name, stats] of Object.entries(record.data)) {
      if (!name || name.includes('용병')) continue
      const total = totals.get(name) || { name, 승점: 0, 골: 0, 어시: 0 }
      total.승점 += numberOrZero(stats?.['승점'])
      total.골 += numberOrZero(stats?.['골'])
      total.어시 += numberOrZero(stats?.['어시'])
      totals.set(name, total)
    }
  }

  const rankedPlayers = [...totals.values()].map((player) => ({
    ...player,
    GA: player.골 + player.어시,
    preferredFoot: memberInfo?.[player.name]?.preferredFoot,
  })).sort((a, b) =>
    b.승점 - a.승점 || b.GA - a.GA || b.골 - a.골 ||
    b.어시 - a.어시 || byName(a, b),
  )

  const isGoalkeeper = (player) => {
    const info = memberInfo?.[player.name]
    return info?.goalKeeper === true || info?.goalkeeper === true
  }
  const registeredGoalkeeper = rankedPlayers.find(isGoalkeeper)
  const topFive = registeredGoalkeeper
    ? [registeredGoalkeeper, ...rankedPlayers.filter((player) => player.name !== registeredGoalkeeper.name).slice(0, 4)]
    : rankedPlayers.slice(0, 5)

  if (topFive.length === 0) return null

  // Without a registered goalkeeper in this quarter, the fifth-ranked player fills GK.
  const goleiro = registeredGoalkeeper || topFive[topFive.length - 1]
  const pivo = topFive.filter((player) => player.name !== goleiro?.name).sort((a, b) =>
    b.골 - a.골 || b.GA - a.GA || b.승점 - a.승점 || byName(a, b),
  )[0] || null
  // Each position needs a different player, including when every stat is tied.
  const used = new Set([pivo?.name, goleiro?.name].filter(Boolean))
  const alaCandidates = topFive.filter((player) => !used.has(player.name))
    .sort((a, b) =>
      b.어시 - a.어시 || b.GA - a.GA || b.승점 - a.승점 || byName(a, b),
    ).slice(0, 2)
  const footRank = { L: 0, R: 1 }
  const [leftAla = null, rightAla = null] = alaCandidates.sort((a, b) =>
    (footRank[a.preferredFoot] ?? 99) - (footRank[b.preferredFoot] ?? 99) || byName(a, b),
  )
  if (leftAla) used.add(leftAla.name)
  if (rightAla) used.add(rightAla.name)

  const fixo = topFive.filter((player) => !used.has(player.name))
    .sort((a, b) =>
      b.GA - a.GA || b.승점 - a.승점 || b.골 - a.골 ||
      b.어시 - a.어시 || byName(a, b),
    )[0] || null

  return { pivo, leftAla, rightAla, fixo, goleiro }
}
