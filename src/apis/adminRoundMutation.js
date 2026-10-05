import { createAdminRound, createAdminRoundDrafts, getAdminRoundScores, validateAdminGoal } from './adminRoundDraft.js'
import { getRoundParticipants } from './roundParticipants.js'

export function getAdminRoundVersion(value) {
  if (Array.isArray(value)) return `[${value.map(getAdminRoundVersion).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort()
    .map((key) => `${JSON.stringify(key)}:${getAdminRoundVersion(value[key])}`).join(',')}}`
  return JSON.stringify(value ?? null)
}

const clockPattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
const fullClock = (time) => time.length === 5 ? `${time}:00` : time
const validId = (id) => typeof id === 'string' && id.length > 0 && !/[.#$[\]/]/.test(id)
const isMarker = ([id, goal]) => id === 'fever-time-bar' || goal?.id === 'fever-time-bar'
const hasRoster = (weeklyTeam, team) => Array.isArray(weeklyTeam?.data?.[team])
  && weeklyTeam.data[team].some((name) => typeof name === 'string' && name.trim())

function validateRound(round, weeklyTeam) {
  if (!clockPattern.test(round.time)) throw new Error('라운드 시작 시간을 확인해주세요.')
  if (round.teams.length !== 2 || round.teams[0] === round.teams[1]
    || round.teams.some((team) => !hasRoster(weeklyTeam, team))) {
    throw new Error('주간 팀에 명단이 있는 서로 다른 두 팀을 선택해주세요.')
  }
  if (!['playing', 'draw', ...round.teams].includes(round.result)) throw new Error('라운드 결과를 확인해주세요.')
}

function writeRound(raw, draft, weeklyTeam) {
  validateRound(draft, weeklyTeam)
  for (const goal of draft.goals) {
    const error = validateAdminGoal(goal, draft)
    if (error) throw new Error(error)
  }
  // Preserve marker and unknown fields while storing the team next to each goal.
  const goals = Object.fromEntries(Object.entries(raw.goal || {}).filter(isMarker))
  for (const goal of draft.goals) goals[goal.id] = {
    ...raw.goal?.[goal.id], id: goal.id, time: fullClock(goal.time),
    goal: goal.goal.trim(), assist: goal.assist.trim(), team: goal.fever ? '' : goal.team, fever: goal.fever,
  }
  if (draft.goals.some((goal) => goal.fever) && !Object.entries(goals).some(isMarker)) {
    goals['fever-time-bar'] = { id: 'fever-time-bar', time: draft.goals.find((goal) => goal.fever).time }
  }
  const numbers = draft.result === 'playing' ? [] : draft.result === 'draw' ? draft.teams : [draft.result]
  return { ...raw, id: draft.id, index: draft.index, time: fullClock(draft.time), teamList: draft.teams,
    goal: goals, getGoalTeam: draft.goals.filter((goal) => !goal.fever).map((goal) => goal.team),
    participant: numbers.length ? getRoundParticipants(weeklyTeam, draft.teams) : [],
    winnerTeam: numbers.length ? { number: numbers, member: getRoundParticipants(weeklyTeam, numbers) } : null,
    lostTeam: numbers.length === 1 ? draft.teams.find((team) => team !== numbers[0]) : false }
}

export function applyAdminRoundMutation(source, operation, weeklyTeam) {
  const rounds = createAdminRoundDrafts(source)
  const next = { ...source }
  if (operation.type === 'addRound') {
    if (getAdminRoundVersion(source || {}) !== getAdminRoundVersion(operation.expected || {})) {
      throw new Error('새 라운드나 기록이 들어왔습니다. 최신 기록에서 다시 추가해주세요.')
    }
    if (rounds.some((round) => round.result === 'playing')) throw new Error('진행중인 라운드를 먼저 종료해주세요.')
    if (rounds.some((round) => Object.entries(source[round.id]?.goal || {}).some(isMarker))) {
      throw new Error('피버 타임에는 새 라운드를 추가할 수 없습니다.')
    }
    const draft = { ...createAdminRound(rounds, operation.draft.teams),
      time: operation.draft.time, result: operation.draft.result }
    if (next[draft.id]) throw new Error('라운드 번호가 이미 사용 중입니다.')
    next[draft.id] = writeRound({ pointWinners: [], updated: false }, draft, weeklyTeam)
    return next
  }
  if (!validId(operation.roundId) || !source?.[operation.roundId]
    || getAdminRoundVersion(source[operation.roundId]) !== getAdminRoundVersion(operation.expected)) {
    throw new Error('이 라운드의 기록이 변경되었습니다. 최신 기록에서 다시 수정해주세요.')
  }
  if (operation.type === 'deleteRound') {
    delete next[operation.roundId]
    return Object.keys(next).length ? next : null
  }
  const raw = source[operation.roundId]
  const round = rounds.find((item) => item.id === operation.roundId)
  let draft = { ...round, goals: [...round.goals] }
  if (operation.type === 'saveRound') {
    draft = { ...draft, time: operation.draft.time, teams: operation.draft.teams.map(String), result: operation.draft.result }
    draft.goals = draft.goals.map((goal) => ({ ...goal,
      team: goal.fever ? '' : draft.teams[round.teams.indexOf(goal.team)] || goal.team }))
    if (draft.result === 'playing' && (round.id !== rounds.at(-1).id
      || rounds.some((item) => item.id !== round.id && item.result === 'playing')
      || Object.entries(raw.goal || {}).some(isMarker))) {
      throw new Error('진행중으로 변경할 수 있는 것은 피버 타임 이전의 마지막 라운드뿐입니다.')
    }
  } else if (operation.type === 'saveGoal') {
    const goal = operation.draft
    if (!validId(goal.id) || goal.id === 'fever-time-bar') throw new Error('기록 ID가 올바르지 않습니다.')
    if (operation.isNew ? raw.goal?.[goal.id] : !draft.goals.some((item) => item.id === goal.id)) {
      throw new Error('추가·수정할 기록을 다시 확인해주세요.')
    }
    if (goal.fever && (round.id !== rounds.at(-1).id || round.result === 'playing')) {
      throw new Error('피버 타임 기록은 종료된 마지막 라운드에만 등록할 수 있습니다.')
    }
    draft.goals = operation.isNew ? [...draft.goals, goal] : draft.goals.map((item) => item.id === goal.id ? goal : item)
  } else if (operation.type === 'deleteGoal') {
    if (!draft.goals.some((goal) => goal.id === operation.goalId)) throw new Error('삭제할 기록이 없습니다.')
    draft.goals = draft.goals.filter((goal) => goal.id !== operation.goalId)
  } else throw new Error('지원하지 않는 기록 작업입니다.')

  draft.goals.sort((a, b) => fullClock(a.time).localeCompare(fullClock(b.time)) || a.id.localeCompare(b.id))
  // Player-only/fever edits retain manually chosen tiebreak results.
  if (operation.type !== 'saveRound' && round.result !== 'playing'
    && getAdminRoundVersion(getAdminRoundScores(round)) !== getAdminRoundVersion(getAdminRoundScores(draft))) {
    const [a, b] = getAdminRoundScores(draft)
    draft.result = a === b ? 'draw' : draft.teams[a > b ? 0 : 1]
  }
  next[round.id] = writeRound(raw, draft, weeklyTeam)
  return next
}
