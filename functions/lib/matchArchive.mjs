import { createHash, randomUUID } from 'node:crypto'
import { getDailyMVP } from './records.mjs'

const fields = ['출석', '골', '어시', '승점', '경기']
const canonical = (value) => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value

export class RecordDataError extends Error {}
export const matchRevision = (value) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
const same = (left, right) => matchRevision(left) === matchRevision(right)
const emptyStats = () => Object.fromEntries(fields.map((field) => [field, 0]))

function validateField(field, value) {
  if (!fields.includes(field) || !Number.isSafeInteger(value) || value < 0 || (field === '출석' && value > 1)) {
    throw new RecordDataError(`Invalid record value: ${field}`)
  }
}

function validateStats(stats) {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) throw new RecordDataError('Invalid daily stats')
  for (const values of Object.values(stats)) {
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new RecordDataError('Invalid player stats')
    for (const [field, value] of Object.entries(values)) validateField(field, value)
  }
}

export function applyRecordOverrides(baseStats, overrides = {}) {
  validateStats(baseStats)
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new RecordDataError('Invalid overrides')
  const stats = structuredClone(baseStats)
  for (const [name, values] of Object.entries(overrides)) {
    if (values === null) {
      delete stats[name]
      continue
    }
    validateStats({ [name]: values })
    stats[name] = { ...emptyStats(), ...stats[name], ...values }
  }
  return stats
}

// Absolute, field-level overrides keep a manual correction stable across RTDB rebuilds.
export function captureRecordOverrides(overrides, publishedStats, currentStats) {
  validateStats(currentStats)
  const next = structuredClone(overrides)
  for (const name of new Set([...Object.keys(publishedStats), ...Object.keys(currentStats)])) {
    const before = publishedStats[name]
    const after = currentStats[name]
    if (same(before || null, after || null)) continue
    if (!after) {
      next[name] = null
      continue
    }
    const values = { ...(next[name] || {}) }
    for (const field of fields) {
      if (!before || (before[field] ?? 0) !== (after[field] ?? 0)) values[field] = after[field] ?? 0
    }
    next[name] = values
  }
  return next
}

export async function publishMatchArchive({ firestore, target, rounds, weeklyTeam, baseStats, now,
  leaseToken, previousBaseStats, expectedArchiveRevision, writeStats = true }) {
  validateStats(baseStats)
  const stateRef = firestore.doc(`matchFinalizations/${target.key}`)
  const archiveRef = firestore.doc(`matchArchives/${target.key}`)
  const statsRef = firestore.doc(`${target.year}/${target.day}`)
  const correctionRef = firestore.doc(`matchCorrections/${target.key}`)
  const versionsRef = firestore.doc('recordCacheVersions/years')
  return firestore.runTransaction(async (transaction) => {
    const [stateSnapshot, archiveSnapshot, statsSnapshot, correctionSnapshot, versionsSnapshot] = await Promise.all(
      [stateRef, archiveRef, statsRef, correctionRef, versionsRef].map((ref) => transaction.get(ref)))
    const state = stateSnapshot.data() || {}
    if (leaseToken ? state.token !== leaseToken : state.status === 'finalizing' && state.leaseUntil > now) {
      throw new Error('Finalization lease changed or still running')
    }
    const previousArchive = archiveSnapshot.data()
    if (expectedArchiveRevision !== undefined && (previousArchive?.revision || null) !== expectedArchiveRevision) {
      throw new Error('Archive changed during rebuild; retry with the latest data')
    }
    const savedStats = statsSnapshot.data() || {}
    const savedOverrides = correctionSnapshot.data()?.overrides || {}
    // Read the latest daily document in this transaction, not an out-of-order event snapshot.
    // This also captures a console edit racing an RTDB rebuild before it can be overwritten.
    const publishedStats = previousArchive?.stats || previousBaseStats
    const overrides = publishedStats
      ? captureRecordOverrides(savedOverrides, publishedStats, savedStats) : savedOverrides
    const stats = applyRecordOverrides(baseStats, overrides)
    const bestPlayers = getDailyMVP(stats)
    const payload = { rounds, weeklyTeam, baseStats, stats, bestPlayers }
    if (Buffer.byteLength(JSON.stringify(payload)) > 900000) throw new RecordDataError('Match archive exceeds the safe document size')
    const revision = matchRevision(payload)
    const changed = revision !== previousArchive?.revision
    const nextState = {
      status: 'finalized', revision,
      finalizedAt: state.finalizedAt || now,
      updatedAt: changed ? now : state.updatedAt || now,
    }
    if (!same(overrides, savedOverrides)) transaction.set(correctionRef, { overrides, updatedAt: now })
    if (writeStats && !same(stats, savedStats)) transaction.set(statsRef, stats)
    if (changed) {
      transaction.set(archiveRef, { ...payload, revision })
      if (writeStats || Object.keys(stats).length) transaction.set(firestore.doc(`daily_mvp/${target.weeklyTeamId}`), { bestPlayers })
      transaction.set(versionsRef, {
        revisions: { ...versionsSnapshot.data()?.revisions, [target.year]: randomUUID() }, updatedAt: now,
      })
    }
    if (!same(nextState, state)) transaction.set(stateRef, nextState)
    return nextState
  })
}
