import { useCallback, useEffect, useRef, useState } from 'react'
import LetsRecord from './ParentTap/LetsRecord.jsx'
import RecordEntryPreview from './ParentTap/RecordEntryPreview.jsx'
import { recordUiTestMode } from '@/config/recordUiTestMode.js'
import StatusBoard from './ParentTap/StatusBoard.jsx'
import RecordRoom from './ParentTap/RecordRoom.jsx'
import WeeklyTeam from './ParentTap/WeeklyTeam.jsx'

const TapTemplate = (props) => {
  const { test, open, setOpen, tap, setTap, setRegisteredTeam, headerHeight, setSelectedYear, recordRoomLoadingFlag } = props
  const [transition, setTransition] = useState({ tap, phase: 'idle' })
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const latestTap = useRef(tap)
  const displayedTap = transition.tap
  const phase = transition.phase

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    latestTap.current = tap
    setTransition((current) => {
      if (reducedMotion) {
        return current.tap === tap && current.phase === 'idle' ? current : { tap, phase: 'idle' }
      }
      if (tap === current.tap) {
        return current.phase === 'leaving' ? { tap, phase: 'idle' } : current
      }
      // Keep only the latest request; a new selection during entry replaces it immediately.
      if (current.phase === 'entering') return { tap, phase: 'entering' }
      return current.phase === 'leaving' ? current : { ...current, phase: 'leaving' }
    })
  }, [tap, reducedMotion])

  const finishTransition = useCallback((expectedPhase, expectedTap) => {
    setTransition((current) => {
      if (current.phase !== expectedPhase || current.tap !== expectedTap) return current
      if (current.phase === 'leaving') {
        const nextTap = latestTap.current
        return { tap: nextTap, phase: nextTap === current.tap ? 'idle' : 'entering' }
      }
      return current.phase === 'entering' ? { ...current, phase: 'idle' } : current
    })
  }, [])

  useEffect(() => {
    if (phase === 'idle') return undefined
    // Complete even if the browser cancels an animation or the page is backgrounded.
    const timer = window.setTimeout(() => finishTransition(phase, displayedTap), phase === 'leaving' ? 120 : 200)
    return () => window.clearTimeout(timer)
  }, [phase, displayedTap, finishTransition])

  const handleAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) return
    if ((phase === 'leaving' && event.animationName === 'parent-tab-leave') ||
      (phase === 'entering' && event.animationName === 'parent-tab-enter')) {
      finishTransition(phase, displayedTap)
    }
  }
  const animationClass = phase === 'leaving' ? 'motion-safe:animate-parent-tab-leave'
    : phase === 'entering' ? 'motion-safe:animate-parent-tab-enter' : ''
  const [startX, setStartX] = useState(null)
  const [moveX, setMoveX] = useState(null)
  const [isLastElementInViewport, setIsLastElementInViewport] = useState(false)
  const [isFirstElementInViewport, setIsFirstElementInViewport] =
    useState(false)

  // 슬라이드 시 탭 이동
  // const handleTouchStart = (e) => {
  //   setStartX(e.touches[0].clientX)
  //   setMoveX(e.touches[0].clientX)
  //
  //   if (tap === 1) {
  //     const isElementInViewport = (element) => {
  //       const rect = element.getBoundingClientRect()
  //       return (
  //         rect.top >= 0 &&
  //         rect.left >= 0 &&
  //         rect.bottom <=
  //           (window.innerHeight || document.documentElement.clientHeight) &&
  //         rect.right <=
  //           (window.innerWidth || document.documentElement.clientWidth)
  //       )
  //     }
  //
  //     const firstElement = document.getElementById('first_element')
  //     const lastElement = document.getElementById('last_element')
  //     setIsFirstElementInViewport(isElementInViewport(firstElement))
  //     setIsLastElementInViewport(isElementInViewport(lastElement))
  //   }
  // }

  // const handleTouchMove = (e) => {
  //   setMoveX(e.touches[0].clientX)
  // }
  //
  // const handleTouchEnd = () => {
  //   const diff = startX - moveX
  //   if (diff > 75) {
  //     const nextTap = tap < 3 ? tap + 1 : 0
  //     if (tap !== 1 || (tap === 1 && isLastElementInViewport)) {
  //       setTap(nextTap)
  //     }
  //   } else if (diff < -75) {
  //     const prevTap = tap > 0 ? tap - 1 : 3
  //     if (tap !== 1 || (tap === 1 && isFirstElementInViewport)) {
  //       setTap(prevTap)
  //     }
  //   }
  //   setStartX(null)
  //   setMoveX(null)
  //   setIsLastElementInViewport(false)
  //   setIsFirstElementInViewport(false)
  // }

  return (
    <div
      key={displayedTap}
      className={`relative h-full w-full ${animationClass} ${phase !== 'idle' ? 'pointer-events-none' : ''}`}
      data-parent-tab={displayedTap}
      data-transition={phase}
      aria-busy={phase !== 'idle'}
      aria-hidden={phase === 'leaving' ? true : undefined}
      inert={phase !== 'idle' ? '' : undefined}
      onAnimationEnd={handleAnimationEnd}
      // onTouchStart={handleTouchStart}
      // onTouchMove={handleTouchMove}
      // onTouchEnd={handleTouchEnd}
    >
      {displayedTap === 0 && recordUiTestMode && <RecordEntryPreview />}
      {displayedTap === 0 && !recordUiTestMode && (
        <LetsRecord
          headerHeight={headerHeight}
          setOpen={setOpen}
          open={open}
          setTap={setTap}
          setRegisteredTeam={setRegisteredTeam}
        />
      )}
      {displayedTap === 1 && <StatusBoard />}
      {displayedTap === 2 && (
        <RecordRoom
          test={test}
          setSelectedYear={setSelectedYear}
          recordRoomLoadingFlag={recordRoomLoadingFlag}
        />
      )}
      {displayedTap === 3 && (
        <WeeklyTeam
          test={test}
          setRegisteredTeam={setRegisteredTeam}
        />
      )}
    </div>
  )
}

export default TapTemplate
