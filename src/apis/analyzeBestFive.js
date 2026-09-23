const numberOrZero = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const byName = (a, b) => a.name.localeCompare(b.name, 'ko')
const byPointRate = (a, b) => b.승점 * a.경기 - a.승점 * b.경기

// Reserve GK for the highest-ranked eligible registered goalkeeper.
export const analyzeBestFive = (records, memberInfo, month) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  const quarter = Math.ceil(month / 3)
  const totals = new Map()
  const attendanceDays = new Set()

  for (const record of records || []) {
    if (!/^\d{4}$/.test(record?.id) ||
      Math.ceil(Number(record.id.slice(0, 2)) / 3) !== quarter ||
      !record.data || typeof record.data !== 'object') continue

    for (const [name, stats] of Object.entries(record.data)) {
      if (!name || name.includes('용병') || !(Number(stats?.['출석']) > 0)) continue
      attendanceDays.add(record.id)
      const total = totals.get(name) || { name, 출석일: new Set(), 경기: 0, 승점: 0, 골: 0, 어시: 0 }
      total.출석일.add(record.id)
      const games = Number(stats['경기'])
      const points = Number(stats['승점'])
      if (Number.isFinite(games) && games > 0 && Number.isFinite(points) && points >= 0) {
        total.경기 += games
        total.승점 += points
      }
      total.골 += numberOrZero(stats?.['골'])
      total.어시 += numberOrZero(stats?.['어시'])
      totals.set(name, total)
    }
  }

  const requiredDays = Math.ceil(attendanceDays.size / 2)
  const eligiblePlayers = [...totals.values()]
    .filter((player) => player.출석일.size >= requiredDays)
    .map((player) => ({
      ...player,
      GA: player.골 + player.어시,
      승점률: player.경기 > 0 ? player.승점 / player.경기 : null,
      preferredFoot: memberInfo?.[player.name]?.preferredFoot,
    }))
  if (eligiblePlayers.length === 0) return null

  const pivo = [...eligiblePlayers].sort((a, b) =>
    b.골 - a.골 || b.어시 - a.어시 || byName(a, b),
  )[0]
  const rankedByRate = eligiblePlayers
    .filter((player) => player.경기 > 0)
    .sort((a, b) =>
      byPointRate(a, b) || b.GA - a.GA || b.골 - a.골 ||
      b.어시 - a.어시 || byName(a, b),
    )

  const isGoalkeeper = (player) => {
    const info = memberInfo?.[player.name]
    return info?.goalKeeper === true || info?.goalkeeper === true
  }
  const used = new Set([pivo.name])
  const take = (players) => {
    const player = players.find((candidate) => !used.has(candidate.name)) || null
    if (player) used.add(player.name)
    return player
  }
  const registeredGoalkeeper = take(rankedByRate.filter(isGoalkeeper))
  const byAssists = (a, b) => b.어시 - a.어시 || b.골 - a.골 || byName(a, b)
  const leftAla = take(eligiblePlayers.filter((player) => player.preferredFoot === 'L').sort(byAssists))
  const rightAla = take(eligiblePlayers.filter((player) => player.preferredFoot === 'R').sort(byAssists))
  const fixo = take(rankedByRate)
  // Without an eligible registered goalkeeper, use the best remaining rate.
  const goleiro = registeredGoalkeeper || take(rankedByRate)

  return { pivo, leftAla, rightAla, fixo, goleiro }
}
