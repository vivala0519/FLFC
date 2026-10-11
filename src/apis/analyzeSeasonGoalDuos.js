export const analyzeSeasonGoalDuos = (goals) => {
  const combinations = new Map()
  for (const goal of goals) {
    if (!goal.goal || !goal.assist || goal.goal === '용병' || goal.assist === '용병') continue
    const key = [goal.goal, goal.assist].sort().join('_')
    combinations.set(key, (combinations.get(key) || 0) + 1)
  }

  const ranked = [...combinations].map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
  const topCount = ranked[0]?.count
  const nextCount = ranked.find(({ count }) => count < topCount)?.count
  const chasing = nextCount === undefined ? [] : ranked.filter(({ count }) => count === nextCount)
  return {
    combinations,
    leaders: ranked.filter(({ count }) => count === topCount),
    chasing: chasing.length <= 2 ? chasing : [],
  }
}
