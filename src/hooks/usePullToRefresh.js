import { useEffect, useState } from 'react'

const REFRESH_DISTANCE = 56
const MAX_DISTANCE = 76
const DRAG_RESISTANCE = 0.55
const GESTURE_SLOP = 10
const reloadPage = () => window.location.reload()
const allowRefresh = () => true

const usePullToRefresh = (areaRef, { onRefresh = reloadPage, canRefresh = allowRefresh } = {}) => {
  const [pull, setPull] = useState({ distance: 0, isPulling: false, isRefreshing: false })

  useEffect(() => {
    const area = areaRef.current
    if (!area) return

    let gesture = null
    let distance = 0
    let refreshing = false
    let refreshTimer = null

    const reset = () => {
      gesture = null
      distance = 0
      if (!refreshing) setPull({ distance: 0, isPulling: false, isRefreshing: false })
    }

    const handleStart = (event) => {
      if (refreshing) return
      reset()
      if (event.touches.length !== 1 || window.scrollY > 0 || !canRefresh()) return
      if (event.target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return

      const touch = event.touches[0]
      gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, active: false }
    }

    const handleMove = (event) => {
      if (!gesture || refreshing) return
      const touch = event.touches[0]
      if (event.touches.length !== 1 || touch.identifier !== gesture.id || !canRefresh()) {
        reset()
        return
      }

      const deltaX = Math.abs(touch.clientX - gesture.x)
      const deltaY = touch.clientY - gesture.y
      if (!gesture.active) {
        if (Math.max(deltaX, Math.abs(deltaY)) < GESTURE_SLOP) return
        if (deltaY <= 0 || deltaX >= deltaY || window.scrollY > 0) {
          reset()
          return
        }
        gesture.active = true
      }

      // A non-passive listener prevents the browser's own refresh for this gesture.
      if (event.cancelable) event.preventDefault()
      distance = Math.min(MAX_DISTANCE, Math.max(0, deltaY * DRAG_RESISTANCE))
      setPull({ distance, isPulling: true, isRefreshing: false })
    }

    const handleEnd = (event) => {
      if (!gesture || refreshing) return
      const touch = Array.from(event.changedTouches).find(({ identifier }) => identifier === gesture.id)
      if (!touch) return
      distance = Math.min(MAX_DISTANCE, Math.max(0, (touch.clientY - gesture.y) * DRAG_RESISTANCE))
      if (!gesture.active || event.touches.length || distance < REFRESH_DISTANCE || !canRefresh()) {
        reset()
        return
      }

      gesture = null
      refreshing = true
      setPull({ distance: REFRESH_DISTANCE, isPulling: false, isRefreshing: true })
      refreshTimer = window.setTimeout(onRefresh, 150)
    }

    area.addEventListener('touchstart', handleStart, { passive: true })
    area.addEventListener('touchmove', handleMove, { passive: false })
    area.addEventListener('touchend', handleEnd)
    area.addEventListener('touchcancel', reset)

    return () => {
      area.removeEventListener('touchstart', handleStart)
      area.removeEventListener('touchmove', handleMove)
      area.removeEventListener('touchend', handleEnd)
      area.removeEventListener('touchcancel', reset)
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
    }
  }, [areaRef, onRefresh, canRefresh])

  return { ...pull, isReady: pull.distance >= REFRESH_DISTANCE }
}

export default usePullToRefresh
