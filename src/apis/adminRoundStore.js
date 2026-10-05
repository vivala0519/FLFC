import { getAdminMatchContext } from './adminRoundDraft.js'
import { applyAdminRoundMutation, getAdminRoundVersion } from './adminRoundMutation.js'
import { createRecordMemberResolver } from './recordMembers.js'
import { formatDailyRecordStats } from './formatDailyRecordStats.js'

export function createAdminRoundStore({ readWeeklyTeam, readRounds, transactRounds, writeStats, now = () => new Date() }) {
  const checkTime = (context) => {
    const actual = getAdminMatchContext(now())
    if (!actual.canEdit || actual.key !== context.key) throw new Error('일요일 08:00 - 10:00에만 기록을 변경할 수 있습니다.')
  }
  const prepare = async (context, memberInfo) => {
    checkTime(context)
    if (!memberInfo.members?.length) throw new Error('회원 정보를 모두 불러온 후 다시 시도해주세요.')
    const weeklyTeam = await readWeeklyTeam(context)
    if (!weeklyTeam?.data || !Object.values(weeklyTeam.data).some((roster) => Array.isArray(roster)
      && roster.some((name) => typeof name === 'string' && name.trim()))) {
      throw new Error('오늘의 주간 팀 명단을 먼저 등록해주세요.')
    }
    const resolveMember = createRecordMemberResolver(memberInfo.members, memberInfo.oneCharacterMembers, memberInfo.nicknames)
    const unknown = Object.values(weeklyTeam.data).flatMap((roster) => Array.isArray(roster) ? roster : [])
      .find((name) => typeof name === 'string' && name.trim() && !name.includes('용병') && !resolveMember(name))
    if (unknown) throw new Error(`${unknown}: 주간 팀의 회원 정보를 확인해주세요.`)
    return { weeklyTeam, resolveMember }
  }
  const syncStats = async (context, { weeklyTeam, resolveMember }) => {
    let rounds = await readRounds(context)
    // RTDB and Firestore cannot share a transaction; recheck concurrent goals after each aggregate write.
    for (let attempt = 0; attempt < 3; attempt++) {
      // Complete an already authorized save even if it crosses 10:00 during network requests.
      const records = Object.values(rounds || {})
      const goals = records.flatMap((round) => Object.entries(round.goal || {}).map(([id, goal]) => ({ ...goal, id })))
      await writeStats(context, formatDailyRecordStats(weeklyTeam, goals, records, resolveMember))
      const latest = await readRounds(context)
      if (getAdminRoundVersion(latest) === getAdminRoundVersion(rounds)) return
      rounds = latest
    }
    throw new Error('새 기록이 계속 들어와 집계가 지연되었습니다. 집계를 다시 시도해주세요.')
  }
  return {
    async save(context, operation, memberInfo) {
      const prepared = await prepare(context, memberInfo)
      if (operation.type === 'saveGoal') {
        const scorer = prepared.resolveMember(operation.draft.goal)
        if (scorer && scorer === prepared.resolveMember(operation.draft.assist)) throw new Error('득점자와 도움 선수가 같아요.')
        const attendees = new Set(Object.values(prepared.weeklyTeam.data).flatMap((roster) => Array.isArray(roster) ? roster : [])
          .map(prepared.resolveMember).filter(Boolean))
        for (const name of [operation.draft.goal, operation.draft.assist]) {
          if (!name?.trim() || name.includes('용병') || name === '자책') continue
          if (!attendees.has(prepared.resolveMember(name))) throw new Error(`${name}: 오늘 명단에서 회원을 확인할 수 없습니다.`)
        }
      }
      // Prime the transaction cache so an initial null does not reject an existing round.
      await readRounds(context)
      let mutationError
      let applied = false
      const result = await transactRounds(context, (current) => {
        applied = false
        mutationError = null
        try {
          checkTime(context)
          if (current == null && operation.type !== 'addRound') {
            mutationError = new Error('이 라운드의 기록이 변경되었습니다. 최신 기록에서 다시 수정해주세요.')
            return null
          }
          const next = applyAdminRoundMutation(current, operation, prepared.weeklyTeam)
          applied = true
          return next
        } catch (error) {
          mutationError = error
          return undefined
        }
      })
      if (!result.committed || !applied) throw mutationError || new Error('기록 저장이 취소되었습니다. 다시 시도해주세요.')
      try {
        await syncStats(context, prepared)
        return { statsPending: false }
      } catch (error) {
        return { statsPending: true, message: `기록은 저장됐지만 현황판 집계에 실패했습니다. ${error.message}` }
      }
    },
    async retryStats(context, memberInfo) {
      await syncStats(context, await prepare(context, memberInfo))
    },
  }
}
