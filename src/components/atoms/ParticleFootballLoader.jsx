import { useEffect, useRef, useState } from 'react'
import footballIcon from '@/assets/futsal-ball4.png'
import './ParticleFootballLoader.css'

const ASSEMBLE_DURATION = 1200
const HOLD_DURATION = 600
const DISPERSE_DURATION = 1200
const CYCLE_DURATION = ASSEMBLE_DURATION + HOLD_DURATION + DISPERSE_DURATION
const smoothstep = value => value * value * (3 - 2 * value)

const ParticleFootballLoader = () => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const rendered = ready && !failed

  useEffect(() => {
    let active = true
    let scene

    import('@/football/scene.js').then(({ createFootballScene }) => {
      if (!active) return
      scene = createFootballScene(canvasRef.current, {
        compact: true,
        compactDiameter: 88,
        interactive: false,
        onReady: () => {
          if (active) { setReady(true); setFailed(false) }
        },
        onError: () => { if (active) setFailed(true) },
      })
      sceneRef.current = scene
      scene.setPaused(true)
      scene.setDissolve(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1)
    }).catch(() => { if (active) setFailed(true) })

    return () => {
      active = false
      scene?.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!rendered) return
    const scene = sceneRef.current
    const container = containerRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let elapsed = 0
    let previousTime = 0

    const animate = now => {
      frame = 0
      if (document.hidden || reducedMotion.matches) return
      if (previousTime) elapsed += Math.min(now - previousTime, 64)
      previousTime = now
      const time = elapsed % CYCLE_DURATION
      let dissolve
      let phase

      if (time < ASSEMBLE_DURATION) {
        dissolve = 1 - smoothstep(time / ASSEMBLE_DURATION)
        phase = 'assembling'
      } else if (time < ASSEMBLE_DURATION + HOLD_DURATION) {
        dissolve = 0
        phase = 'assembled'
      } else {
        dissolve = smoothstep((time - ASSEMBLE_DURATION - HOLD_DURATION) / DISPERSE_DURATION)
        phase = 'dispersing'
      }

      scene.setDissolve(dissolve)
      container.dataset.phase = phase
      frame = requestAnimationFrame(animate)
    }

    const updatePlayback = () => {
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
      if (reducedMotion.matches) {
        scene.setDissolve(0)
        container.dataset.phase = 'assembled'
      } else if (!document.hidden) {
        frame = requestAnimationFrame(animate)
      }
    }

    document.addEventListener('visibilitychange', updatePlayback)
    reducedMotion.addEventListener('change', updatePlayback)
    updatePlayback()

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', updatePlayback)
      reducedMotion.removeEventListener('change', updatePlayback)
    }
  }, [rendered])

  return (
    <div ref={containerRef} className="particle-football-loader" data-renderer={failed ? 'fallback' : ready ? 'webgl' : 'loading'} aria-hidden="true">
      <canvas ref={canvasRef} className="particle-football-loader__canvas" style={{ opacity: rendered ? 1 : 0 }} />
      {!rendered && (
        <span className="particle-football-loader__fallback">
          <img src={footballIcon} alt="" />
          {Array.from({ length: 36 }, (_, index) => (
            <i
              key={index}
              style={{ '--x': `${Math.cos(index * 2.4) * (66 + (index % 7) * 4)}px`, '--y': `${Math.sin(index * 2.4) * (66 + (index % 7) * 4)}px` }}
            />
          ))}
        </span>
      )}
    </div>
  )
}

export default ParticleFootballLoader
