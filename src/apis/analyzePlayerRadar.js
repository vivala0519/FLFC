const metrics = [
  { key: 'goals', label: '골', unit: '골' },
  { key: 'assists', label: '어시', unit: '어시' },
  { key: 'points', label: '승점', unit: '점' },
  { key: 'pointRate', label: '승점생산률', unit: '점/경기' },
  { key: 'attendance', label: '출석', unit: '회' },
]

const nonNegativeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

export const analyzePlayerRadar = (records, members, month) => {
  const players = new Map()
  const quarter = Number.isInteger(month) && month >= 1 && month <= 12
    ? Math.ceil(month / 3) : null
  const memberNames = new Set((members || []).filter((name) => typeof name === 'string' && !name.includes('용병')))

  for (const record of records || []) {
    if (!quarter || !/^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(record?.id) ||
      Math.ceil(Number(record.id.slice(0, 2)) / 3) !== quarter ||
      !record.data || typeof record.data !== 'object') continue

    for (const [name, stats] of Object.entries(record.data)) {
      if (!memberNames.has(name) || !(nonNegativeNumber(stats?.['출석']) > 0)) continue
      const player = players.get(name) || {
        name, goals: 0, assists: 0, points: 0, games: 0, attendance: 0, pointRate: 0,
      }
      player.goals += nonNegativeNumber(stats['골'])
      player.assists += nonNegativeNumber(stats['어시'])
      player.points += nonNegativeNumber(stats['승점'])
      player.games += nonNegativeNumber(stats['경기'])
      player.attendance += 1
      players.set(name, player)
    }
  }

  for (const player of players.values()) {
    player.pointRate = player.games > 0 ? player.points / player.games : 0
  }

  const axes = metrics.map((metric) => {
    const values = [...players.values()].map((player) => player[metric.key])
    return {
      ...metric,
      max: Math.max(0, ...values),
      average: values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    }
  })

  return { players, axes }
}
