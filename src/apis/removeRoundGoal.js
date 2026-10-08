// Remove the details and its corresponding team together, including fever-time records.
export function removeRoundGoal(round, goalId) {
  if (!round?.goal?.[goalId] || goalId === 'fever-time-bar') return
  const ordered = Object.entries(round.goal).sort((a, b) =>
    String(a[1]?.time || '').localeCompare(String(b[1]?.time || '')) || a[0].localeCompare(b[0]),
  )
  const markerIndex = ordered.findIndex(([id]) => id === 'fever-time-bar')
  const beforeFever = ordered.filter(([id, goal], index) => id !== 'fever-time-bar'
    && goal.fever !== true && (goal.fever === false || markerIndex < 0 || index < markerIndex))
  const scoredIndex = beforeFever.findIndex(([id]) => id === goalId)
  // Atomic goal commits can arrive in a different order than their display timestamps.
  const teamIndex = scoredIndex < 0 ? -1 : round.goal[goalId].team != null
    ? (round.getGoalTeam || []).findIndex((team) => String(team) === String(round.goal[goalId].team))
    : scoredIndex
  const goal = { ...round.goal }
  delete goal[goalId]
  return {
    ...round, goal,
    ...(teamIndex >= 0 && Array.isArray(round.getGoalTeam)
      ? { getGoalTeam: round.getGoalTeam.filter((_, index) => index !== teamIndex) } : {}),
  }
}
