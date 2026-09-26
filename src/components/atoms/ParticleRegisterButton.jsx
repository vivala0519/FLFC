import { useEffect, useRef, useState } from 'react'
import footballIcon from '@/assets/circle-ball.png'
import './ParticleRegisterButton.css'

// Keep one canvas alive while the input changes so the same particles morph.
const ParticleRegisterButton = ({ hasScorer, onRegister, disabled = false, buttonType = 'button' }) => {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const expandedRef = useRef(!hasScorer)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  expandedRef.current = !hasScorer

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
    }).catch(() => { if (active) setFailed(true) })

    return () => {
      active = false
      scene?.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setExpanded(!hasScorer)
  }, [hasScorer])

  const rendered = ready && !failed

  return (
    <button
      type={buttonType}
      className="particle-register"
      data-state={hasScorer ? 'assembled' : 'expanded'}
      data-renderer={failed ? 'fallback' : ready ? 'webgl' : 'loading'}
      disabled={!hasScorer || disabled}
      onClick={onRegister}
      aria-label={hasScorer ? '득점 기록 등록' : '득점자를 입력하면 등록할 수 있습니다'}
    >
      <canvas ref={canvasRef} className="particle-register__canvas" aria-hidden="true" style={{ opacity: rendered ? 1 : 0 }} />
      {!rendered && (
        <span className="particle-register__fallback" aria-hidden="true">
          {hasScorer ? <img src={footballIcon} alt="" /> : (
            Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ '--x': `${Math.cos(i * 2.4) * (14 + i)}px`, '--y': `${Math.sin(i * 2.4) * (14 + i)}px` }} />
            ))
          )}
        </span>
      )}
      {/*<span className="particle-register__label" aria-hidden="true">등록</span>*/}
    </button>
  )
}

export default ParticleRegisterButton
