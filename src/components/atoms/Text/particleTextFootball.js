import { createFootballGeometry } from '../../../football/geometry.js'

let footballSamples

// Share the football's real panel topology, without loading Three.js or WebGL.
function getFootballSamples() {
  if (footballSamples) return footballSamples
  const geometry = createFootballGeometry({ radius: 1, spacing: 0.08 })
  const samples = []
  const tilt = Math.atan(1 / ((1 + Math.sqrt(5)) / 2))
  const cosTilt = Math.cos(tilt)
  const sinTilt = Math.sin(tilt)
  const yaw = -0.18
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)

  for (let index = 0; index < geometry.count; index += 1) {
    const offset = index * 3
    const x = geometry.positions[offset]
    const y = geometry.positions[offset + 1] * cosTilt - geometry.positions[offset + 2] * sinTilt
    const z = geometry.positions[offset + 1] * sinTilt + geometry.positions[offset + 2] * cosTilt
    const front = z * cosYaw - x * sinYaw
    if (front < 0) continue
    const pentagon = geometry.panelTypes[index] === 1
    const seam = geometry.seam[index] > 0.92
    samples.push({
      x: x * cosYaw + z * sinYaw,
      y,
      // All dots keep the logo color; opacity distinguishes the ball's panels.
      alpha: (pentagon ? 1 : seam ? 0.85 : 0.16) * (0.65 + front * 0.35),
      radius: pentagon ? 0.65 : seam ? 0.5 : 0.38,
      seed: geometry.seeds[index],
    })
  }
  // Shuffle spatially so adjacent glyph dots do not all fly to the same panel.
  footballSamples = samples.sort((a, b) => a.seed - b.seed)
  return footballSamples
}

export function createFootballTargets(count, centerX, centerY, radius) {
  const samples = getFootballSamples()
  return Array.from({ length: count }, (_, index) => {
    const sample = samples[Math.floor((index + 0.5) * samples.length / count)]
    return {
      x: centerX + sample.x * radius,
      y: centerY + sample.y * radius,
      alpha: sample.alpha,
      radius: sample.radius,
    }
  })
}
