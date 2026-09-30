const recordDate = (year, id) => {
  if (!/^\d{4}$/.test(year) || !/^\d{4}$/.test(id)) return null
  const month = Number(id.slice(0, 2))
  const day = Number(id.slice(2, 4))
  const date = new Date(Date.UTC(Number(year), month - 1, day))
  if (date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null
  return `${year}-${id.slice(0, 2)}-${id.slice(2, 4)}`
}

// Missing a game preserves the run; attending without the selected stat resets it.
const analyzeAttendanceStreak = (recordsByYear, members, asOfDate, statKey) => {
  const players = [...new Set(members || [])].filter((name) =>
    typeof name === 'string' && name.trim() && !name.includes('용병'),
  )
  const streaks = new Map(players.map((name) => [name, { current: 0, best: 0 }]))
  const days = new Map()

  for (const [year, records] of Object.entries(recordsByYear || {})) {
    for (const record of records || []) {
      const date = recordDate(year, record?.id)
      if (date && date <= asOfDate) days.set(date, record.data)
    }
  }

  for (const [, data] of [...days].sort(([a], [b]) => a.localeCompare(b))) {
    for (const [name, streak] of streaks) {
      const stats = data?.[name]
      if (!(Number(stats?.['출석']) > 0)) continue
      streak.current = Number(stats[statKey]) > 0 ? streak.current + 1 : 0
      streak.best = Math.max(streak.best, streak.current)
    }
  }

  const count = Math.max(0, ...[...streaks.values()].map((streak) => streak.current))
  const nextCount = Math.max(0, ...[...streaks.values()]
    .filter((streak) => streak.current < count)
    .map((streak) => streak.current))
  const chasing = nextCount > 0
    ? [...streaks].filter(([, streak]) => streak.current === nextCount)
      .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko'))
    : []
  const additional = chasing.length <= 2 ? chasing : []
  const allTimeCount = Math.max(0, ...[...streaks.values()].map((streak) => streak.best))
  return {
    name: count > 0
      ? [...streaks].filter(([, streak]) => streak.current === count)
        .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko'))
      : [],
    count,
    additional,
    additionalCount: additional.length > 0 ? nextCount : 0,
    allTimeRecord: {
      name: allTimeCount > 0
        ? [...streaks].filter(([, streak]) => streak.best === allTimeCount)
          .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko'))
        : [],
      count: allTimeCount,
    },
  }
}

export const analyzeScoringStreak = (recordsByYear, members, asOfDate) =>
  analyzeAttendanceStreak(recordsByYear, members, asOfDate, '골')

export const analyzeAssistStreak = (recordsByYear, members, asOfDate) =>
  analyzeAttendanceStreak(recordsByYear, members, asOfDate, '어시')

export const analyzeLongestAbsent = (recordsByYear, members, asOfDate) => {
  const candidates = new Set([...new Set(members || [])].filter((name) =>
    typeof name === 'string' && name.trim() && !name.includes('용병'),
  ))
  const lastAttendance = new Map()

  for (const [year, records] of Object.entries(recordsByYear || {})) {
    for (const record of records || []) {
      const date = recordDate(year, record?.id)
      if (!date || date > asOfDate) continue
      for (const [name, stats] of Object.entries(record.data || {})) {
        if (!candidates.has(name) || !(Number(stats?.['출석']) > 0)) continue
        if (!lastAttendance.has(name) || date > lastAttendance.get(name)) {
          lastAttendance.set(name, date)
        }
      }
    }
  }

  if (lastAttendance.size === 0) return { name: [], lastDate: null }
  const lastDate = [...lastAttendance.values()].sort()[0]
  return {
    name: [...lastAttendance].filter(([, date]) => date === lastDate)
      .map(([name]) => name).sort((a, b) => a.localeCompare(b, 'ko')),
    lastDate,
  }
}
