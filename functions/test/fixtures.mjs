import { finalizeMatch } from '../lib/finalizeMatch.mjs'
import { getMatchTarget } from '../lib/matchDate.mjs'

export const target = getMatchTarget('2026-10-04T10:00:00+09:00')
export const weeklyTeam = { id: '261004', data: { '1': ['김근홍', '전의준'], '2': ['선우용', '정우진'], '3': [] } }
export const members = { total: ['김근홍', '전의준', '선우용', '정우진'], oneCharacter: ['선우용'], nickName: { 의준이: '전의준' } }
export const round = (extra = {}) => ({ index: 1, id: '01', time: '09:54:00', teamList: ['1', '2'], ...extra })

export function stores(rounds, initial = {}, matchTarget = target) {
  const documents = new Map(Object.entries({ [`weeklyTeam/${matchTarget.weeklyTeamId}`]: weeklyTeam.data, 'members/members': members, ...initial }))
  const writes = []
  let queue = Promise.resolve()
  let failFinalCommit = false
  const snapshot = (path) => {
    const exists = documents.has(path)
    const value = structuredClone(documents.get(path))
    return { exists, data: () => structuredClone(value) }
  }
  const firestore = {
    doc: (path) => ({ path }),
    getAll: async (...refs) => refs.map((ref) => snapshot(ref.path)),
    runTransaction: (callback) => {
      const result = queue.then(async () => {
        const changes = []
        const value = await callback({ get: async (ref) => snapshot(ref.path), set: (ref, data) => changes.push([ref.path, structuredClone(data)]) })
        if (failFinalCommit && changes.some(([path]) => path.startsWith('matchArchives/'))) {
          failFinalCommit = false
          throw new Error('Simulated Firestore outage')
        }
        for (const [path, data] of changes) { documents.set(path, data); writes.push([path, data]) }
        return value
      })
      queue = result.catch(() => {})
      return result
    },
  }
  let current = structuredClone(rounds)
  const database = { ref: () => ({
    get: async () => ({ val: () => structuredClone(current) }),
    transaction: async (callback) => {
      const result = callback(structuredClone(current))
      if (result !== undefined) current = result
      return { committed: result !== undefined, snapshot: { val: () => structuredClone(current) } }
    },
  }) }
  return {
    documents, writes, firestore, database,
    get rounds() { return current },
    set rounds(value) { current = value },
    failNextFinalCommit() { failFinalCommit = true },
    run: (now = matchTarget.endAt) => finalizeMatch({ firestore, database, target: matchTarget, now }),
  }
}
