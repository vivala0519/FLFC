// The original 1024 × 683 reference is sampled without modifying the image.
// Only the observed hemisphere is projected; the reverse uses inferred panels.
export const REFERENCE_BALL = { x: 517, y: 342, radiusX: 266, radiusY: 266 }
const REFERENCE_CAMERA_DISTANCE = 6.35 / 1.65

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smoothstep = (min, max, value) => {
  const t = clamp((value - min) / (max - min), 0, 1)
  return t * t * (3 - 2 * t)
}
const linear = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4

export function projectReferenceDirection(x, y, z) {
  const distance = REFERENCE_CAMERA_DISTANCE
  const projection = Math.sqrt(distance * distance - 1) / (distance - z)
  return {
    x: REFERENCE_BALL.x + x * projection * REFERENCE_BALL.radiusX,
    y: REFERENCE_BALL.y - y * projection * REFERENCE_BALL.radiusY,
    // A narrow feather near the photographic horizon hides the join to the
    // repeated reverse-side graphic without smearing the front logo.
    weight: smoothstep(0.23, 0.48, z),
  }
}

function samplePhoto(photo, x, y, result) {
  x = clamp(x * photo.width / 1024, 0, photo.width - 1.001)
  y = clamp(y * photo.height / 683, 0, photo.height - 1.001)
  const left = Math.floor(x)
  const top = Math.floor(y)
  const tx = x - left
  const ty = y - top
  for (let channel = 0; channel < 3; channel++) {
    const a = photo.data[(top * photo.width + left) * 4 + channel]
    const b = photo.data[(top * photo.width + left + 1) * 4 + channel]
    const c = photo.data[((top + 1) * photo.width + left) * 4 + channel]
    const d = photo.data[((top + 1) * photo.width + left + 1) * 4 + channel]
    result[channel] = ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) / 255
  }
}

export function createParticlePalette(positions, inferredColors, photo = null) {
  const count = positions.length / 3
  const colors = new Float32Array(positions.length)
  const ink = new Float32Array(count)
  const observed = new Float32Array(count)
  const rgb = [0, 0, 0]
  const pixel = [0, 0, 0]
  for (let i = 0; i < count; i++) {
    const offset = i * 3
    const length = Math.hypot(positions[offset], positions[offset + 1], positions[offset + 2])
    const projection = projectReferenceDirection(
      positions[offset] / length, positions[offset + 1] / length, positions[offset + 2] / length,
    )
    const weight = photo ? projection.weight : 0
    if (weight > 0) samplePhoto(photo, projection.x, projection.y, pixel)
    for (let channel = 0; channel < 3; channel++) {
      rgb[channel] = inferredColors[offset + channel] * (1 - weight) + pixel[channel] * weight
      colors[offset + channel] = linear(rgb[channel])
    }
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    const chroma = Math.max(...rgb) - Math.min(...rgb)
    ink[i] = Math.max(smoothstep(0.12, 0.43, 1 - luminance), smoothstep(0.15, 0.44, chroma))
    observed[i] = weight
  }
  return { colors, ink, observed }
}

export async function loadReferencePhoto(url) {
  const source = new Image()
  source.src = url
  await source.decode()
  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('참고 사진의 색상을 읽을 수 없습니다.')
  context.drawImage(source, 0, 0)
  return context.getImageData(0, 0, canvas.width, canvas.height)
}
