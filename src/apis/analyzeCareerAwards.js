import { rankCareerEntries } from './rankCareerEntries.js'

const AWARDS = [
  ['point_king', '승점왕'],
  ['goal_king', '득점왕'],
  ['assist_king', '어시왕'],
  ['attendance_king', '출석왕'],
]

const QUARTERS = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 }

const createEligibleMemberSet = (eligibleMembers) => eligibleMembers === null ? null : new Set(
  (Array.isArray(eligibleMembers) || eligibleMembers instanceof Set ? [...eligibleMembers] : [])
    .filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))

export const analyzeCareerAwards = (historyRecords, playerName, asOfDate = null) => {
  if (typeof playerName !== 'string' || !playerName.trim()) return []

  const asOfMatch = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/.exec(asOfDate || '')
  const lastQuarter = asOfMatch
    ? Number(asOfMatch[1]) * 4 + Math.ceil(Number(asOfMatch[2]) / 3)
    : Infinity
  const counts = Object.fromEntries(AWARDS.map(([key]) => [key, 0]))

  for (const record of historyRecords || []) {
    const season = /^(\d{4})_(1st|2nd|3rd|4th)$/.exec(record?.id)
    if (!season || Number(season[1]) * 4 + QUARTERS[season[2]] > lastQuarter) continue

    for (const [key] of AWARDS) {
      const winners = record.data?.[key]
      if (Array.isArray(winners) ? winners.includes(playerName) : winners === playerName) {
        counts[key]++
      }
    }
  }

  return AWARDS
    .filter(([key]) => counts[key] > 0)
    .map(([key, label]) => `${label}x${counts[key]}`)
}

export const analyzeCareerAwardLeaders = (historyRecords, asOfDate = null, eligibleMembers = null) => {
  const allowedMembers = createEligibleMemberSet(eligibleMembers)
  const asOfMatch = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/.exec(asOfDate || '')
  const lastQuarter = asOfMatch
    ? Number(asOfMatch[1]) * 4 + Math.ceil(Number(asOfMatch[2]) / 3) : Infinity
  const counts = new Map(AWARDS.map(([key]) => [key, new Map()]))
  const recordsById = new Map((historyRecords || []).map((record) => [record?.id, record]))

  for (const record of recordsById.values()) {
    const season = /^(\d{4})_(1st|2nd|3rd|4th)$/.exec(record?.id)
    if (!season || Number(season[1]) * 4 + QUARTERS[season[2]] > lastQuarter) continue
    for (const [key] of AWARDS) {
      const rawWinners = record.data?.[key]
      const names = new Set((Array.isArray(rawWinners) ? rawWinners : [rawWinners])
        .filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))
      for (const name of names) {
        if (allowedMembers && !allowedMembers.has(name)) continue
        counts.get(key).set(name, (counts.get(key).get(name) || 0) + 1)
      }
    }
  }

  return AWARDS.map(([key, label]) => {
    const entries = [...counts.get(key)]
    const maximum = Math.max(0, ...entries.map(([, count]) => count))
    const nextCount = Math.max(0, ...entries.filter(([, count]) => count < maximum).map(([, count]) => count))
    const chasers = entries.filter(([, count]) => nextCount > 0 && count === nextCount)
      .map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    return {
      key,
      label: key === 'assist_king' ? '도움왕' : label,
      winners: entries.filter(([, count]) => count === maximum)
        .map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
      chasers: chasers.length <= 2 ? chasers : [],
      rankings: rankCareerEntries(entries.map(([name, count]) => ({ name, value: count, count: `${count}회` }))),
    }
  })
}

export const analyzeTitleCollections = (historyRecords, asOfDate = null, eligibleMembers = null) => {
  const allowedMembers = createEligibleMemberSet(eligibleMembers)
  const groups = [
    { key: 'double', label: '더블', titleCount: 2, winners: [] },
    { key: 'treble', label: '트레블', titleCount: 3, winners: [] },
    { key: 'quadruple', label: '쿼드러플', titleCount: 4, winners: [] },
  ]
  const asOfMatch = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/.exec(asOfDate || '')
  const lastQuarter = asOfMatch
    ? Number(asOfMatch[1]) * 4 + Math.ceil(Number(asOfMatch[2]) / 3) : Infinity
  const titlesByPlayer = new Map()
  const recordsById = new Map((historyRecords || []).map((record) => [record?.id, record]))

  for (const record of recordsById.values()) {
    const season = /^(\d{4})_(1st|2nd|3rd|4th)$/.exec(record?.id)
    if (!season || Number(season[1]) * 4 + QUARTERS[season[2]] > lastQuarter) continue
    for (const [key] of AWARDS) {
      const rawWinners = record.data?.[key]
      const names = new Set((Array.isArray(rawWinners) ? rawWinners : [rawWinners])
        .filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))
      for (const name of names) {
        if (allowedMembers && !allowedMembers.has(name)) continue
        const titles = titlesByPlayer.get(name) || new Set()
        titles.add(key)
        titlesByPlayer.set(name, titles)
      }
    }
  }

  for (const [name, titles] of titlesByPlayer) {
    groups.find(({ titleCount }) => titleCount === titles.size)?.winners.push({
      name,
      titles: AWARDS.filter(([key]) => titles.has(key)).map(([, label]) => label),
    })
  }
  for (const group of groups) group.winners.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  return groups
}
