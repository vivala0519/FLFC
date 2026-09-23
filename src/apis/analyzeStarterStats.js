const getLeaders = (players, rateKey) => {
  let maxRate = 50
  let leaders = []

  for (const [name, stats] of players) {
    const rate = stats[rateKey]
    if (rate > maxRate) {
      maxRate = rate
      leaders = [name]
    } else if (rate === maxRate && maxRate > 50) {
      leaders.push(name)
    }
  }

  return leaders.sort((a, b) => a.localeCompare(b, 'ko'))
}

export const analyzeStarterStats = (records) => {
  const dataByTime = new Map()

  for (const record of records) {
    if (record?.id === 'fever-time-bar' || typeof record?.time !== 'string') continue
    const hour = Number(record.time.split(':')[0])
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue

    const period = hour < 9 ? 'first' : 'second'
    for (const name of [record.goal, record.assist]) {
      if (typeof name !== 'string' || !name.trim() || name === '용병') continue
      if (!dataByTime.has(name)) dataByTime.set(name, { first: 0, second: 0 })
      dataByTime.get(name)[period]++
    }
  }

  for (const stats of dataByTime.values()) {
    const total = stats.first + stats.second
    // Keep full numeric precision for ranking; format only when displaying rates.
    stats.firstRate = (stats.first / total) * 100
    stats.secondRate = (stats.second / total) * 100
  }

  return {
    dataByTime,
    earlyStarter: getLeaders(dataByTime, 'firstRate'),
    slowStarter: getLeaders(dataByTime, 'secondRate'),
  }
}
