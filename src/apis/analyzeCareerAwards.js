const AWARDS = [
  ['point_king', '승점왕'],
  ['goal_king', '득점왕'],
  ['assist_king', '어시왕'],
  ['attendance_king', '출석왕'],
]

const QUARTERS = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 }

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
