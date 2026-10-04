import { useEffect, useRef, useState } from 'react'
import footballIcon from '@/assets/futsal-ball4.png'
import './ParticleRegisterButton.css'

// Keep one canvas alive while the input changes so the same particles morph.
const ParticleRegisterButton = ({ hasScorer, onRegister, disabled = false, buttonType = 'button', rolling = false, onRollComplete, burstTargetRef, onPrepareBurst }) => {
  const buttonRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const expandedRef = useRef(!hasScorer)
  const rollAngleRef = useRef(null)
  const dissolveRef = useRef(0)
  const rollCompleteRef = useRef(onRollComplete)
  const prepareBurstRef = useRef(onPrepareBurst)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  expandedRef.current = !hasScorer && !rolling
  rollCompleteRef.current = onRollComplete
  prepareBurstRef.current = onPrepareBurst

  useEffect(() => {
    let active = true
    let scene

    // Load Three.js only when the recording controls are actually mounted.
    import('@/football/scene.js').then(({ createFootballScene }) => {
      if (!active) return
      scene = createFootballScene(canvasRef.current, {
        compact: true,
        interactive: false,
        initialExpanded: expandedRef.current,
        onReady: () => {
          if (active) { setReady(true); setFailed(false) }
        },
        onError: () => { if (active) setFailed(true) },
      })
      sceneRef.current = scene
      scene.setRollRotation(rollAngleRef.current)
      scene.setDissolve(dissolveRef.current)
    }).catch(() => { if (active) setFailed(true) })

    return () => {
      active = false
      scene?.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setExpanded(!hasScorer && !rolling)
  }, [hasScorer, rolling])

  useEffect(() => {
    if (!rolling) return
    prepareBurstRef.current?.()
    const button = buttonRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const bounds = button.getBoundingClientRect()
    const canvasBounds = canvasRef.current.getBoundingClientRect()
    const returnToTarget = Boolean(burstTargetRef?.current) && !reducedMotion
    const ballCenter = { x: canvasBounds.left + canvasBounds.width / 2, y: canvasBounds.top + canvasBounds.height / 2 }
    const distance = bounds.left + bounds.width / 2
    const rollDuration = 500
    const hiddenDuration = 100
    const returnDuration = 500
    const dissolveDuration = 500
    const arrivalTime = returnToTarget ? rollDuration + hiddenDuration + returnDuration : rollDuration
    const duration = reducedMotion ? 160 : arrivalTime + dissolveDuration
    const exitDistance = bounds.right + 24
    const savedStyle = button.getAttribute('style')
    if (returnToTarget) {
      // Fixed coordinates let the ball travel past the viewport without growing the form.
      Object.assign(button.style, {
        position: 'fixed', left: `${bounds.left}px`, top: `${bounds.top}px`, zIndex: '80',
      })
      button.style.setProperty('--burst-canvas-left', `${canvasBounds.left - bounds.left - canvasBounds.width / 2}px`)
      button.style.setProperty('--burst-canvas-top', `${canvasBounds.top - bounds.top - canvasBounds.height / 2}px`)
    }
    const started = performance.now()
    let frame

    const animate = (now) => {
      const elapsed = now - started
      const progress = Math.min(elapsed / duration, 1)
      const rollProgress = Math.min(elapsed / rollDuration, 1)
      const dissolveProgress = reducedMotion ? 0 : Math.min(Math.max((elapsed - arrivalTime) / dissolveDuration, 0), 1)
      const dissolve = dissolveProgress * dissolveProgress * (3 - 2 * dissolveProgress)
      const travelled = reducedMotion ? 0 : distance * (1 - (1 - rollProgress) ** 3)
      let translateX = -travelled
      let translateY = 0
      let opacity = reducedMotion ? 1 - progress : 1
      let angle = travelled / 24
      let phase = dissolveProgress > 0 ? 'dispersing' : 'rolling'

      if (returnToTarget) {
        const targetBounds = burstTargetRef.current.getBoundingClientRect()
        const borderWidth = parseFloat(getComputedStyle(burstTargetRef.current).borderBottomWidth) || 0
        const targetX = targetBounds.left + targetBounds.width / 2 - ballCenter.x
        const targetY = targetBounds.bottom - borderWidth / 2 - ballCenter.y
        const viewport = window.visualViewport
        const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
        const belowScreenY = viewportBottom + canvasBounds.height / 2 + 24 - ballCenter.y

        if (elapsed < rollDuration) {
          translateX = -exitDistance * rollProgress ** 2
          angle = -translateX / 24
          phase = 'exiting'
        } else if (elapsed < rollDuration + hiddenDuration) {
          translateX = -exitDistance
          opacity = 0
          phase = 'hidden'
        } else {
          const returnProgress = Math.min((elapsed - rollDuration - hiddenDuration) / returnDuration, 1)
          const returnEase = 1 - (1 - returnProgress) ** 3
          translateX = targetX
          translateY = belowScreenY + (targetY - belowScreenY) * returnEase
          angle = (exitDistance + belowScreenY - translateY) / 24
          phase = dissolveProgress > 0 ? 'dispersing' : 'returning'
        }
      }
      rollAngleRef.current = angle
      dissolveRef.current = dissolve
      button.style.transform = `translate(${translateX}px, ${translateY}px)`
      button.style.opacity = String(opacity)
      button.style.setProperty('--roll-angle', `${-angle}rad`)
      button.style.setProperty('--dissolve', String(dissolve))
      button.dataset.phase = phase
      sceneRef.current?.setRollRotation(angle)
      sceneRef.current?.setDissolve(dissolve)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        rollCompleteRef.current?.()
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      rollAngleRef.current = null
      dissolveRef.current = 0
      sceneRef.current?.setRollRotation(null)
      sceneRef.current?.setDissolve(0)
      if (savedStyle === null) button.removeAttribute('style')
      else button.setAttribute('style', savedStyle)
      delete button.dataset.phase
    }
  }, [rolling, burstTargetRef])

  const rendered = ready && !failed

  return (
    <button
      ref={buttonRef}
      type={buttonType}
      className="particle-register"
      data-state={rolling ? 'rolling' : hasScorer ? 'assembled' : 'expanded'}
      data-renderer={failed ? 'fallback' : ready ? 'webgl' : 'loading'}
      disabled={!hasScorer || disabled || rolling}
      onClick={onRegister}
      aria-label={hasScorer ? '득점 기록 등록' : '득점자를 입력하면 등록할 수 있습니다'}
    >
      <canvas ref={canvasRef} className="particle-register__canvas" aria-hidden="true" style={{ opacity: rendered ? 1 : 0 }} />
      {!rendered && (
        <span className="particle-register__fallback" aria-hidden="true">
          {hasScorer || rolling ? <img src={footballIcon} alt="" /> : (
            Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ '--x': `${Math.cos(i * 2.4) * (14 + i)}px`, '--y': `${Math.sin(i * 2.4) * (14 + i)}px` }} />
            ))
          )}
          <span className="particle-register__burst">
            {Array.from({ length: 36 }, (_, i) => (
              <i key={i} style={{ '--x': `${Math.cos(i * 2.4) * (25 + i)}px`, '--y': `${Math.sin(i * 2.4) * (25 + i)}px` }} />
            ))}
          </span>
        </span>
      )}
      {/*<span className="particle-register__label" aria-hidden="true">등록</span>*/}
    </button>
  )
}

export default ParticleRegisterButton
