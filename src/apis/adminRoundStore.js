import { getAdminMatchContext } from './adminRoundDraft.js'
import { applyAdminRoundMutation, getAdminRoundVersion } from './adminRoundMutation.js'
import { createRecordMemberResolver } from './recordMembers.js'
import { formatAdminDailyRecordStats } from './formatAdminDailyRecordStats.js'

export function createAdminRoundStore({ readRounds, transactRounds, writeStats, readStats = async () => ({}), readGameStatus = async () => null, now = () => new Date() }) {
  const checkTime = (context) => {
    const actual = getAdminMatchContext(now())
    if (!actual.canEdit || actual.key !== context.key) throw new Error('일요일 08:00 - 10:00에만 기록을 변경할 수 있습니다.')
  }
  const prepare = async (context, memberInfo = {}) => {
    checkTime(context)
    const status = await readGameStatus(context)
    checkTime(context)
    if (status?.end_game) throw new Error('경기가 종료되어 기록을 변경할 수 없습니다.')
    const weeklyTeam = memberInfo.weeklyTeam || { data: {} }
    const resolveMember = createRecordMemberResolver(memberInfo.members, memberInfo.oneCharacterMembers, memberInfo.nicknames)
    return { weeklyTeam, resolveMember, memberInfo }
  }
  const syncStats = async (context, { memberInfo }) => {
    let rounds = await readRounds(context)
    // RTDB and Firestore cannot share a transaction; recheck concurrent goals after each aggregate write.
    for (let attempt = 0; attempt < 3; attempt++) {
      // After the deadline the server owns the aggregate, even for an earlier accepted RTDB write.
      const actual = getAdminMatchContext(now())
      if (!actual.canEdit || actual.key !== context.key) return false
      if ((await readGameStatus(context))?.end_game) return false
      const existingStats = await readStats(context) || {}
      const recordedMembers = Object.entries(existingStats).filter(([, stats]) =>
        stats && typeof stats === 'object' && !Array.isArray(stats)
        && ['출석', '골', '어시', '승점', '경기'].some((field) => Object.prototype.hasOwnProperty.call(stats, field)),
      ).map(([name]) => name)
      const resolveMember = createRecordMemberResolver(
        [...(memberInfo.members || []), ...recordedMembers],
        memberInfo.oneCharacterMembers, memberInfo.nicknames,
      )
      const beforeWrite = getAdminMatchContext(now())
      if (!beforeWrite.canEdit || beforeWrite.key !== context.key) return false
      const records = Object.values(rounds || {})
      await writeStats(context, formatAdminDailyRecordStats(existingStats, records, resolveMember))
      const latest = await readRounds(context)
      if (getAdminRoundVersion(latest) === getAdminRoundVersion(rounds)) return true
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
        const synced = await syncStats(context, prepared)
        return { statsPending: false, ...(synced ? {} : { finalizedByServer: true }) }
      } catch (error) {
        return { statsPending: true, message: `기록은 저장됐지만 현황판 집계에 실패했습니다. ${error.message}` }
      }
    },
    async retryStats(context, memberInfo) {
      await syncStats(context, await prepare(context, memberInfo))
    },
  }
}
