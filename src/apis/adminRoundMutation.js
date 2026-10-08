import { createAdminRound, createAdminRoundDrafts, getAdminRoundScores, validateAdminGoal } from './adminRoundDraft.js'

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
const memberList = (value) => Array.isArray(value)
  ? [...new Set(value.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))] : []

function validateRound(round) {
  if (!clockPattern.test(round.time)) throw new Error('라운드 시작 시간을 확인해주세요.')
  if (round.teams.length !== 2 || round.teams[0] === round.teams[1]
    || round.teams.some((team) => typeof team !== 'string' || !team.trim() || !validId(team))) {
    throw new Error('서로 다른 두 팀을 선택해주세요.')
  }
  if (!['playing', 'draw', ...round.teams].includes(round.result)) throw new Error('라운드 결과를 확인해주세요.')
}

function getStoredTeamMembers(raw, draft, weeklyTeam) {
  const originalTeams = Array.isArray(raw.teamList) ? raw.teamList.map(String) : []
  const originalWinners = Array.isArray(raw.winnerTeam?.number) ? raw.winnerTeam.number.map(String) : []
  const participants = memberList(raw.participant)
  const winners = memberList(raw.winnerTeam?.member)
  return Object.fromEntries(draft.teams.map((team) => {
    let roster = memberList(raw.teamMembers?.[team])
    // Recover the two rosters from the stored winner and participant snapshot.
    if (!roster.length && originalTeams.includes(team) && originalWinners.length === 1) {
      if (team === originalWinners[0]) roster = winners
      else if (participants.length && winners.length && winners.every((name) => participants.includes(name))) {
        roster = participants.filter((name) => !winners.includes(name))
      }
    }
    if (!roster.length) roster = memberList(weeklyTeam?.data?.[team])
    return [team, roster]
  }))
}

function writeRound(raw, draft, weeklyTeam) {
  validateRound(draft)
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
  const teamMembers = getStoredTeamMembers(raw, draft, weeklyTeam)
  const allRostersKnown = draft.teams.every((team) => teamMembers[team].length > 0)
  const participants = allRostersKnown ? memberList(draft.teams.flatMap((team) => teamMembers[team])) : memberList(raw.participant)
  const previousNumbers = Array.isArray(raw.winnerTeam?.number) ? raw.winnerTeam.number.map(String) : []
  const sameResult = getAdminRoundVersion([...previousNumbers].sort()) === getAdminRoundVersion([...numbers].sort())
  const winningMembers = numbers.every((team) => teamMembers[team].length > 0)
    ? memberList(numbers.flatMap((team) => teamMembers[team]))
    : sameResult ? memberList(raw.winnerTeam?.member) : numbers.length === 2 ? participants : []
  return { ...raw, id: draft.id, index: draft.index, time: fullClock(draft.time), teamList: draft.teams,
    teamMembers,
    goal: goals, getGoalTeam: draft.goals.filter((goal) => !goal.fever).map((goal) => goal.team),
    participant: numbers.length ? participants : [],
    winnerTeam: numbers.length ? { number: numbers, member: winningMembers } : null,
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
