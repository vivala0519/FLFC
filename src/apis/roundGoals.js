export const getQuarterRoundGoals = (yearData, month) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return []

  const quarter = Math.ceil(month / 3)
  return Object.entries(yearData || {}).flatMap(([key, rounds]) => {
    if (!/^\d{4}_rounds$/.test(key)) return []

    const date = key.slice(0, 4)
    const recordMonth = Number(date.slice(0, 2))
    const recordDay = Number(date.slice(2, 4))
    if (
      recordMonth < 1 || recordMonth > 12 ||
      recordDay < 1 || recordDay > 31 ||
      Math.ceil(recordMonth / 3) !== quarter
    ) return []

    const goals = Object.values(rounds || {}).flatMap((round) =>
      Object.entries(round?.goal || {})
        .filter(([id, goal]) =>
          id !== 'fever-time-bar' &&
          goal?.id !== 'fever-time-bar' &&
          typeof goal?.goal === 'string' && goal.goal.trim() !== '' &&
          typeof goal.time === 'string' &&
          /^([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(goal.time),
        )
        .map(([, goal]) => goal),
    )

    // Match the former goal-only dates: an empty round is not a week of goal data.
    return goals.length > 0 ? [[date, goals]] : []
  })
}
