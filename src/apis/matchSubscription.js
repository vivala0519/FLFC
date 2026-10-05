// Coordinates listeners and the final archive without depending on Firebase APIs.
export function subscribeMatch(target, sources, onData, onError) {
  let stopped = false
  let generation = 0
  let stopRounds
  let stopState
  let finalRevision
  const stopLive = () => {
    stopRounds?.()
    stopState?.()
    stopRounds = undefined
    stopState = undefined
  }
  const publish = (value) => { if (!stopped) onData({ ...target, ...value }) }
  const fail = (error) => { if (!stopped) onError(error) }

  async function receiveState(state) {
    if (stopped) return
    if (state?.status !== 'finalized' || !state.revision) {
      if (state?.status === 'error') publish({ status: 'error', error: state.error })
      return
    }
    if (state.revision === finalRevision) return
    finalRevision = state.revision
    const request = ++generation
    try {
      const archive = await sources.loadFinalArchive(state.revision)
      if (stopped || request !== generation) return
      if (archive?.revision !== state.revision) throw new Error('Final archive revision does not match completion state')
      publish({ status: 'finalized', ...state, ...archive })
      stopLive()
    } catch (error) {
      if (request === generation) finalRevision = undefined
      fail(error)
    }
  }

  void (async () => {
    try {
      const state = await sources.readState()
      if (stopped) return
      if (state?.status === 'finalized' && state.revision) {
        await receiveState(state)
        return
      }
      if (!target.isCurrentSunday && !state) {
        const archive = await sources.loadLegacyArchive()
        publish({ status: 'legacy', ...archive })
        return
      }
      publish({ status: state?.status === 'error' ? 'error' : 'live' })
      stopRounds = sources.listenRounds((rounds) => publish({ rounds }), fail)
      stopState = sources.listenState((next) => { void receiveState(next) }, fail)
      if (stopped) stopLive()
    } catch (error) {
      fail(error)
    }
  })()
  return () => {
    stopped = true
    generation++
    stopLive()
  }
}
