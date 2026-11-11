// Keep every metric tie, including ties beyond the last visible ranking row.
export const rankCareerEntries = (entries, compare = null) => {
  const compareMetric = compare || ((a, b) => b.value - a.value)
  const ranked = (Array.isArray(entries) ? entries : [])
    .filter((entry) => typeof entry?.name === 'string' && entry.name.trim() &&
      typeof entry.value === 'number' && Number.isFinite(entry.value))
    .map((entry) => ({ ...entry }))
    .sort((a, b) => compareMetric(a, b) || a.name.localeCompare(b.name, 'ko'))

  let rank = 0
  return ranked.map((entry, index) => {
    if (index === 0 || compareMetric(entry, ranked[index - 1]) !== 0) rank = index + 1
    return { ...entry, rank }
  })
}

export default rankCareerEntries
