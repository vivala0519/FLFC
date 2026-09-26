import { useEffect, useRef } from 'react'
import { createParticleText } from './particleText.js'
import './ParticleText.css'

const ParticleText = ({ children, className = '' }) => {
  const elementRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const effect = createParticleText(elementRef.current, canvasRef.current, children)
    return () => effect.destroy()
  }, [children, className])

  return (
    <span ref={elementRef} className={`${className} particle-text`}>
      <span className="particle-text__source">{children}</span>
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
    </span>
  )
}

export default ParticleText
