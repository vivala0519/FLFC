import { createFootballTargets } from './particleTextFootball.js'

const PADDING = 22
const INTRO_DURATION = 1100
const HOLD_DURATION = 2200
const SCATTER_DURATION = 1000
const SCATTER_HOLD_DURATION = 1200
const ASSEMBLE_DURATION = 1500
const CYCLE_DURATION = HOLD_DURATION + SCATTER_DURATION + SCATTER_HOLD_DURATION + ASSEMBLE_DURATION
const TWO_PI = Math.PI * 2
const ease = value => value * value * (3 - 2 * value)

function getScatterAmount(elapsed) {
  if (elapsed < INTRO_DURATION) return 1 - ease(elapsed / INTRO_DURATION)
  const phase = (elapsed - INTRO_DURATION) % CYCLE_DURATION
  if (phase < HOLD_DURATION) return 0
  if (phase < HOLD_DURATION + SCATTER_DURATION) {
    return ease((phase - HOLD_DURATION) / SCATTER_DURATION)
  }
  const assemblyStart = HOLD_DURATION + SCATTER_DURATION + SCATTER_HOLD_DURATION
  if (phase < assemblyStart) return 1
  return 1 - ease((phase - assemblyStart) / ASSEMBLE_DURATION)
}

// Rasterize the actual CSS font so the logo keeps its existing glyphs and color.
// This small text effect uses Canvas 2D and does not need another WebGL context.
export function createParticleText(element, canvas, text) {
  const context = canvas.getContext('2d')
  if (!context) return { destroy() {} }

  const mask = document.createElement('canvas')
  const maskContext = mask.getContext('2d', { willReadFrequently: true })
  if (!maskContext) return { destroy() {} }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let particles = []
  let destroyed = false
  let inView = true
  let frame = 0
  let previousTime = 0
  let elapsed = 0
  let width = 0
  let height = 0
  let ratio = 1
  let fontSize = 35
  let color = ''
  let sampleKey = ''
  let fontReady = false

  function requestRender() {
    if (!destroyed && !frame && inView && !document.hidden && particles.length) {
      frame = requestAnimationFrame(render)
    }
  }

  function build() {
    if (destroyed || !fontReady) return
    const style = getComputedStyle(element)
    const bounds = element.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    fontSize = parseFloat(style.fontSize)
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const spacing = parseFloat(style.letterSpacing) || 0
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const key = [bounds.width, bounds.height, font, spacing, style.color, pixelRatio].join('|')
    if (key === sampleKey) return
    sampleKey = key
    color = style.color
    ratio = pixelRatio
    width = Math.ceil(bounds.width) + PADDING * 2
    height = Math.ceil(bounds.height) + PADDING * 2

    canvas.width = Math.ceil(width * ratio)
    canvas.height = Math.ceil(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.left = `${-PADDING}px`
    canvas.style.top = `${-PADDING}px`

    // A 2x mask retains the font's thin inline strokes.
    mask.width = Math.ceil(width * 2)
    mask.height = Math.ceil(height * 2)
    maskContext.setTransform(2, 0, 0, 2, 0, 0)
    maskContext.font = font
    maskContext.textAlign = 'left'
    maskContext.textBaseline = 'alphabetic'
    maskContext.fillStyle = '#ffffff'
    const metrics = maskContext.measureText(text)
    const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8
    const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.2
    const baseline = PADDING + (bounds.height - ascent - descent) / 2 + ascent

    if ('letterSpacing' in maskContext) {
      maskContext.letterSpacing = `${spacing}px`
      maskContext.fillText(text, PADDING, baseline)
    } else {
      // Match letter spacing in browsers without Canvas letterSpacing support.
      const characters = Array.from(text)
      let prefix = ''
      characters.forEach((character, index) => {
        const x = maskContext.measureText(prefix).width + index * spacing
        maskContext.fillText(character, PADDING + x, baseline)
        prefix += character
      })
    }

    const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data
    const small = fontSize <= 12
    const step = small ? 0.65 : 1.25
    const radius = small ? 0.36 : 0.57
    const scatter = motion.matches ? 0 : getScatterAmount(elapsed)
    const next = []
    for (let y = PADDING; y < height - PADDING; y += step) {
      for (let x = PADDING; x < width - PADDING; x += step) {
        const alpha = pixels[(Math.floor(y * 2) * mask.width + Math.floor(x * 2)) * 4 + 3] / 255
        if (alpha < 0.22) continue
        const seed = next.length * 2.39996323
        next.push({
          homeX: x, homeY: y,
          x, y, vx: 0, vy: 0, seed, radius,
          alpha: Math.min(1, alpha * 1.15),
        })
      }
    }
    // The same glyph particles form a compact, panelled football, then FLFC.
    const ballRadius = Math.min(fontSize * 0.68, width / 2 - 4, height / 2 - 4)
    const targets = createFootballTargets(next.length, width / 2, height / 2, ballRadius)
    particles = next.map((particle, index) => {
      const ball = targets[index]
      const dx = ball.x - particle.homeX
      const dy = ball.y - particle.homeY
      return {
        ...particle, dx, dy, ballAlpha: ball.alpha, ballRadius: ball.radius,
        x: particle.homeX + dx * scatter,
        y: particle.homeY + dy * scatter,
      }
    })
    if (!particles.length) {
      delete element.dataset.particlesReady
      return
    }
    previousTime = 0
    requestRender()
  }

  function render(now) {
    frame = 0
    if (destroyed || !inView || document.hidden) return
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.04) : 1 / 60
    previousTime = now
    const small = fontSize <= 12
    const reduced = motion.matches
    if (!reduced) elapsed += dt * 1000
    const scatter = reduced ? 0 : getScatterAmount(elapsed)
    const spring = 100
    const damping = Math.exp(-14 * dt)

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = color
    particles.forEach(particle => {
      const shimmer = reduced ? 0 : Math.sin(elapsed * 0.0018 + particle.seed) * (small ? 0.035 : 0.12)
      const driftAmount = scatter * (1 - scatter) * 3
      const driftX = reduced ? 0 : Math.sin(elapsed * 0.0012 + particle.seed) * driftAmount
      const driftY = reduced ? 0 : Math.cos(elapsed * 0.0014 + particle.seed) * driftAmount
      const targetX = particle.homeX + particle.dx * scatter + driftX
      const targetY = particle.homeY + particle.dy * scatter + shimmer * (1 - scatter) + driftY
      if (reduced) {
        particle.x = targetX
        particle.y = targetY
        particle.vx = particle.vy = 0
      } else {
        particle.vx = (particle.vx + (targetX - particle.x) * spring * dt) * damping
        particle.vy = (particle.vy + (targetY - particle.y) * spring * dt) * damping
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
      }
      context.globalAlpha = particle.alpha * (1 - scatter) + particle.ballAlpha * scatter
      const radius = particle.radius * (1 - scatter) + particle.ballRadius * scatter
      context.beginPath()
      context.arc(particle.x, particle.y, radius, 0, TWO_PI)
      context.fill()
    })
    context.globalAlpha = 1
    element.dataset.particlesReady = 'true'
    if (!reduced) requestRender()
  }

  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      previousTime = 0
      requestRender()
    }
  }

  function motionChanged() {
    // Restart from a readable logo when motion is enabled again.
    elapsed = INTRO_DURATION
    previousTime = 0
    requestRender()
  }

  function fontsChanged() { sampleKey = ''; build() }

  const resizeObserver = new ResizeObserver(build)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    if (inView) { previousTime = 0; requestRender() }
    else { cancelAnimationFrame(frame); frame = 0 }
  })
  resizeObserver.observe(element)
  visibilityObserver.observe(element)
  document.addEventListener('visibilitychange', visibilityChanged)
  motion.addEventListener('change', motionChanged)
  document.fonts.addEventListener('loadingdone', fontsChanged)

  // Keep the original text visible until its font is loaded and the mask exists.
  const style = getComputedStyle(element)
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const fontSettled = () => { fontReady = true; build() }
  document.fonts.load(font, text).then(fontSettled).catch(fontSettled)

  return {
    destroy() {
      destroyed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', visibilityChanged)
      motion.removeEventListener('change', motionChanged)
      document.fonts.removeEventListener('loadingdone', fontsChanged)
      delete element.dataset.particlesReady
    },
  }
}
