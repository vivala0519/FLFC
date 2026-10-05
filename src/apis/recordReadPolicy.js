let policy
const subscribers = new Set()

export const getRecordReadPolicy = () => policy

export function setRecordReadPolicy(next) {
  const identity = (value) => value && `${value.key}:${value.mode}:${value.revision || ''}:${JSON.stringify(Object.entries(value.yearRevisions || {}).sort())}`
  if (identity(policy) === identity(next)) return
  policy = next
  for (const subscriber of subscribers) subscriber(policy)
}

export function subscribeRecordReadPolicy(onPolicy) {
  subscribers.add(onPolicy)
  if (policy) onPolicy(policy)
  return () => subscribers.delete(onPolicy)
}

export function waitForRecordReadPolicy() {
  if (policy && policy.mode !== 'loading') return Promise.resolve(policy)
  return new Promise((resolve) => {
    const stop = subscribeRecordReadPolicy((value) => {
      if (value.mode !== 'loading') { stop(); resolve(value) }
    })
  })
}
