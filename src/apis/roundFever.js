const isMarker = ([id, goal]) => id === 'fever-time-bar' || goal?.id === 'fever-time-bar'

export const isFeverRound = (round) => Object.entries(round?.goal || {}).some(isMarker)

const secondsFromTime = (time) => {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(time || '')
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0) : null
}

export const getRegularRoundGoals = (round) => {
  const entries = Object.entries(round?.goal || {})
  const marker = entries.find(isMarker)?.[1]
  const feverStart = secondsFromTime(marker?.time)
  return entries.filter((entry) => {
    if (isMarker(entry)) return false
    const goal = entry[1]
    if (typeof goal?.fever === 'boolean') return !goal.fever
    const time = secondsFromTime(goal?.time)
    return feverStart === null || time === null || time < feverStart
  })
}
