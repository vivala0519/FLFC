import * as THREE from 'three'
import { createFootballGeometry } from './geometry.js'
import { createInferredPattern } from './inferredPattern.js'
import { createParticlePalette, loadReferencePhoto } from './referenceColors.js'

const BALL_RADIUS = 1.65
const INITIAL_ROTATION = { x: 0, y: 0 }
const DEFAULT_ACCENT = '#079ccc'

const pointVertex = /* glsl */ `
  attribute float aSeam;
  attribute float aSeed;
  attribute vec3 aPrinted;
  attribute float aInk;
  attribute float aObserved;
  uniform float uTime;
  uniform float uScale;
  uniform float uExpand;
  uniform float uCompact;
  uniform float uPixelRatio;
  uniform float uPulseTime;
  uniform vec3 uPulseOrigin;
  uniform vec3 uHover;
  uniform float uHoverStrength;
  varying vec3 vPrinted;
  varying float vInk;
  varying float vSeam;
  varying float vFront;
  varying float vLight;
  varying float vWave;
  varying float vSeed;
  varying float vRim;

  void main() {
    vec3 radial = normalize(position);
    float age = uTime - uPulseTime;
    float arc = acos(clamp(dot(radial, normalize(uPulseOrigin)), -1.0, 1.0));
    float wave = exp(-pow((arc - age * 2.1) * 7.0, 2.0))
      * exp(-max(age, 0.0) * 0.9) * step(0.0, age);
    float scan = exp(-pow((position.y - sin(uTime * 0.6) * 1.9) * 5.0, 2.0));
    float hover = exp(-pow(distance(radial, uHover) * 5.4, 2.0)) * uHoverStrength;
    float spread = uExpand * mix(0.55 + aSeed * 1.35, -0.95 + aSeed * 1.85, uCompact);
    vec3 drift = vec3(
      sin(aSeed * 74.0 + uTime * 0.19),
      cos(aSeed * 31.0 + uTime * 0.17),
      sin(aSeed * 51.0 - uTime * 0.14)
    );
    vec3 p = position + radial * (spread + wave * 0.09 + hover * 0.035)
      + drift * uExpand * mix(0.20, 0.24, uCompact);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec3 viewNormal = normalize(normalMatrix * radial);
    float facing = dot(viewNormal, normalize(-view.xyz));
    vFront = mix(smoothstep(-0.045, 0.2, facing), 1.0, uCompact * uExpand * 0.62);
    vRim = pow(1.0 - max(0.0, facing), 2.0);
    vLight = 0.55 + 0.45 * max(0.0, dot(viewNormal, normalize(vec3(-0.5, 0.8, 1.2))));
    vWave = clamp(scan * 0.65 + wave * 1.3 + hover * 0.65, 0.0, 1.0);
    vPrinted = aPrinted;
    vInk = aInk;
    vSeam = aSeam * (1.0 - aObserved * 0.82);
    vSeed = aSeed;
    float pointSize = mix(0.016, 0.023, aInk) * (0.85 + 0.28 * aSeed);
    float projectedSize = pointSize * uScale / -view.z * (1.0 + vWave * 0.28);
    float compactSize = mix(1.40, 1.25, aInk) * (0.94 + 0.12 * aSeed) * uPixelRatio;
    gl_PointSize = clamp(mix(projectedSize, compactSize * (1.0 - uExpand * 0.24), uCompact), 1.0, 7.5);
    gl_Position = projectionMatrix * view;
  }
`

const pointFragment = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uExpand;
  uniform float uCompact;
  varying vec3 vPrinted;
  varying float vInk;
  varying float vSeam;
  varying float vFront;
  varying float vLight;
  varying float vWave;
  varying float vSeed;
  varying float vRim;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vFront < 0.005) discard;
    float dotAlpha = 1.0 - smoothstep(mix(0.29, 0.37, uCompact), 0.5, d);
    float seam = smoothstep(0.88, 0.985, vSeam);
    vec3 pearl = mix(vec3(0.48, 0.50, 0.47), vPrinted, 0.28);
    pearl = mix(pearl, mix(vec3(0.82, 0.84, 0.80), vPrinted, 0.30), uCompact);
    vec3 pigment = vPrinted * (0.80 + vLight * 0.20);
    vec3 color = mix(pearl, pigment, vInk);
    // Scan light animates the white shell without repainting the printed bands.
    color = mix(color, uAccent, vWave * mix(mix(0.52, 0.10, vInk), mix(0.12, 0.04, vInk), uCompact));
    color = mix(color, uAccent, vRim * mix(0.10, 0.025, uCompact));
    float alpha = mix(mix(0.44, 0.94, uCompact), 0.98, vInk) * (0.86 + vSeed * 0.14);
    alpha *= mix(1.0, 0.38, seam);
    alpha = min(1.0, alpha + vWave * 0.13 + vRim * 0.13);
    gl_FragColor = vec4(color, dotAlpha * alpha * vFront * (1.0 - uExpand * mix(0.18, 0.45, uCompact)));
    #include <colorspace_fragment>
  }
`

const fieldVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uPulseTime;
  attribute float aSeed;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float r = length(position.xy);
    float a = atan(position.y, position.x);
    float phase = r * 7.0 - uTime * 0.75 + sin(a * 3.0 + uTime * 0.13) * 0.65;
    float wave = pow(sin(phase) * 0.5 + 0.5, 4.0);
    float hole = smoothstep(1.45, 2.0, r);
    float edge = 1.0 - smoothstep(2.45, 4.0, r);
    float pulse = exp(-pow((r - (uTime - uPulseTime) * 1.6) * 4.0, 2.0));
    vAlpha = hole * edge * (0.035 + wave * 0.13 + pulse * 0.1);
    vMix = 0.5 + 0.5 * sin(a + r * 1.7 - uTime * 0.12);
    vec3 p = position;
    p.z += sin(phase) * 0.035;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = max(1.0, 0.013 * uScale / -view.z);
    gl_Position = projectionMatrix * view;
  }
`

const fieldFragment = /* glsl */ `
  uniform vec3 uAccent;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 color = mix(vec3(0.62, 0.60, 0.55), uAccent, vMix * 0.7);
    gl_FragColor = vec4(color, vAlpha * (1.0 - smoothstep(0.25, 0.5, d)));
    #include <colorspace_fragment>
  }
`

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uExpand;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.16 + aSeed * 52.0) * 0.06;
    p.y += cos(uTime * 0.21 + aSeed * 37.0) * 0.08;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vAlpha = (0.06 + 0.11 * sin(aSeed * 97.0 + uTime * 0.7)) * (0.5 + uExpand);
    gl_PointSize = max(1.0, (0.007 + aSeed * 0.01) * uScale / -view.z);
    gl_Position = projectionMatrix * view;
  }
`

const dustFragment = /* glsl */ `
  uniform vec3 uAccent;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uAccent, max(0.0, vAlpha) * (1.0 - smoothstep(0.15, 0.5, d)));
    #include <colorspace_fragment>
  }
`

function makeAttribute(array, itemSize = 1) {
  return new THREE.BufferAttribute(array, itemSize)
}

/**
 * A self-contained renderer with no React dependency.
 * compact draws only the ball, fitting an approximately 48px ball in a small
 * transparent canvas. initialExpanded is applied before the first frame.
 */
export function createFootballScene(canvas, { onReady, onError, onPausedChange, onViewChange, compact = false, initialExpanded = false, interactive = !compact } = {}) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  } catch (error) {
    onError?.(error)
    return { setPaused() {}, setAccent() {}, setExpanded() {}, showFront() {}, showBack() {}, pulse() {}, reset() {}, destroy() {} }
  }

  renderer.setClearColor(0xffffff, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40)
  camera.position.set(0, 0, 6.35)
  camera.lookAt(0, 0, 0)
  const group = new THREE.Group()
  group.rotation.set(INITIAL_ROTATION.x, INITIAL_ROTATION.y, 0)
  scene.add(group)

  const smallScreen = window.matchMedia('(max-width: 680px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const model = createFootballGeometry({ radius: BALL_RADIUS, spacing: compact ? 0.071 : smallScreen ? 0.033 : 0.026 })
  const inferred = createInferredPattern(model)
  const panelOrientation = new THREE.Matrix4().makeRotationX(0.48)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', makeAttribute(model.positions, 3))
  geometry.setAttribute('normal', makeAttribute(model.normals, 3))
  geometry.setAttribute('aSeam', makeAttribute(model.seam))
  geometry.setAttribute('aSeed', makeAttribute(model.seeds))
  geometry.applyMatrix4(panelOrientation)
  const initialPalette = createParticlePalette(geometry.attributes.position.array, inferred.colors)
  geometry.setAttribute('aPrinted', makeAttribute(initialPalette.colors, 3))
  geometry.setAttribute('aInk', makeAttribute(initialPalette.ink))
  geometry.setAttribute('aObserved', makeAttribute(initialPalette.observed))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4)

  const common = {
    uTime: { value: 0 },
    uScale: { value: 1 },
    uExpand: { value: initialExpanded ? 1 : 0 },
    uCompact: { value: compact ? 1 : 0 },
    uPixelRatio: { value: 1 },
    uAccent: { value: new THREE.Color(DEFAULT_ACCENT) },
    uPulseTime: { value: -100 },
  }
  const uniforms = {
    ...common,
    uPulseOrigin: { value: new THREE.Vector3(0, 0.2, 1).normalize() },
    uHover: { value: new THREE.Vector3(0, 0, 1) },
    uHoverStrength: { value: 0 },
  }
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
  const football = new THREE.Points(geometry, material)
  football.renderOrder = 2
  group.add(football)

  // Curved panel seams reinforce the traditional 12/20 soccer-ball construction.
  const seamGeometry = new THREE.BufferGeometry()
  seamGeometry.setAttribute('position', makeAttribute(model.edges, 3))
  seamGeometry.applyMatrix4(panelOrientation)
  const seamMaterial = new THREE.ShaderMaterial({
    uniforms: { uExpand: common.uExpand, uAccent: common.uAccent },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying float vFront;
      varying float vObserved;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normalize(position));
        vFront = smoothstep(0.02, 0.3, dot(n, normalize(-p.xyz)));
        vObserved = smoothstep(0.23, 0.48, normalize(position).z);
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uExpand;
      uniform vec3 uAccent;
      varying float vFront;
      varying float vObserved;
      void main() {
        gl_FragColor = vec4(mix(vec3(0.30, 0.32, 0.31), uAccent, 0.13),
          vFront * 0.12 * (1.0 - vObserved) * (1.0 - smoothstep(0.0, 0.18, uExpand)));
        #include <colorspace_fragment>
      }
    `,
  })
  const seams = new THREE.LineSegments(seamGeometry, seamMaterial)
  seams.renderOrder = 3
  group.add(seams)

  const sceneryResources = []
  let dust = null
  if (!compact) {
    const fieldPositions = []
    const fieldSeeds = []
    for (let x = -4.2; x <= 4.2; x += 0.057) {
      for (let y = -4.2; y <= 4.2; y += 0.057) {
        fieldPositions.push(x, y, -1.2)
        fieldSeeds.push((Math.sin(x * 12.98 + y * 78.23) + 1) * 0.5)
      }
    }
    const fieldGeometry = new THREE.BufferGeometry()
    fieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fieldPositions, 3))
    fieldGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(fieldSeeds, 1))
    const fieldMaterial = new THREE.ShaderMaterial({
      uniforms: common, vertexShader: fieldVertex, fragmentShader: fieldFragment,
      transparent: true, depthWrite: false, depthTest: false,
    })
    const field = new THREE.Points(fieldGeometry, fieldMaterial)
    field.renderOrder = 0
    scene.add(field)

    const dustPositions = []
    const dustSeeds = []
    for (let i = 0; i < 650; i++) {
      const angle = i * 2.39996323
      const z = 1 - 2 * (i + 0.5) / 650
      const radius = 2.05 + (0.5 + 0.5 * Math.sin(i * 128.13)) * 0.7
      const slice = Math.sqrt(1 - z * z)
      dustPositions.push(Math.cos(angle) * slice * radius, z * radius, Math.sin(angle) * slice * radius)
      dustSeeds.push((Math.sin(i * 193.97) + 1) * 0.5)
    }
    const dustGeometry = new THREE.BufferGeometry()
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3))
    dustGeometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(dustSeeds, 1))
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: common, vertexShader: dustVertex, fragmentShader: dustFragment,
      transparent: true, depthWrite: false, depthTest: false,
    })
    dust = new THREE.Points(dustGeometry, dustMaterial)
    dust.renderOrder = 1
    scene.add(dust)
    sceneryResources.push(fieldGeometry, fieldMaterial, dustGeometry, dustMaterial)
  }

  let paused = reducedMotion.matches
  let destroyed = false
  let contextLost = false
  let inView = true
  let frame = 0
  let elapsed = 0
  let previousTime = 0
  let expanded = initialExpanded ? 1 : 0
  let rotationX = INITIAL_ROTATION.x
  let rotationY = INITIAL_ROTATION.y
  let hovered = false
  let dragging = false
  let pointerId = null
  let downX = 0
  let downY = 0
  let lastX = 0
  let lastY = 0
  let pointerDistance = 0
  let kickTime = -100
  let activeUntil = 0
  let restingCameraZ = 6.35
  const expansionCameraOffset = compact ? 1.1 : 5.5
  let photoReady = false
  let introUntil = performance.now() + 6000
  let selectedView = 'front'
  const pointer = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()
  const hit = new THREE.Vector3()
  const hoverTarget = new THREE.Vector3(0, 0, 1)
  const hitSphere = new THREE.Sphere(new THREE.Vector3(), BALL_RADIUS)

  function requestRender() {
    if (!destroyed && !contextLost && !frame && inView && !document.hidden) frame = requestAnimationFrame(render)
  }

  function wake(duration = 800) {
    if (!(compact && reducedMotion.matches)) activeUntil = Math.max(activeUntil, performance.now() + duration)
    requestRender()
  }

  function resize() {
    const width = Math.max(canvas.clientWidth, 1)
    const height = Math.max(canvas.clientHeight, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, !compact && smallScreen ? 1.6 : 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    if (compact) {
      // Fit the spherical silhouette rather than its flat equatorial plane.
      // Leave room for the dispersed state, including on narrow canvases.
      const diameter = Math.max(1, Math.min(48, width * 0.62, height * 0.60))
      const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      restingCameraZ = BALL_RADIUS * Math.sqrt(1 + (height / (diameter * halfFovTangent)) ** 2)
    } else {
      restingCameraZ = width / height < 0.85 ? 7.1 : 6.35
    }
    camera.position.z = restingCameraZ + common.uExpand.value * expansionCameraOffset
    camera.updateProjectionMatrix()
    common.uPixelRatio.value = renderer.getPixelRatio()
    common.uScale.value = renderer.getPixelRatio() * height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    wake()
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    hitSphere.center.copy(group.position)
    hitSphere.radius = BALL_RADIUS + common.uExpand.value
    hovered = Boolean(raycaster.ray.intersectSphere(hitSphere, hit))
    if (hovered) {
      group.updateMatrixWorld()
      hoverTarget.copy(group.worldToLocal(hit.clone())).normalize()
    }
  }

  function pulse() {
    uniforms.uPulseOrigin.value.copy(hovered ? hoverTarget : new THREE.Vector3(0, 0.2, 1).normalize())
    common.uPulseTime.value = elapsed
    kickTime = elapsed
    wake(reducedMotion.matches ? 600 : 2600)
  }

  function onPointerDown(event) {
    if (event.button !== 0 || dragging) return
    dragging = true
    pointerId = event.pointerId
    downX = lastX = event.clientX
    downY = lastY = event.clientY
    pointerDistance = 0
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
    updatePointer(event)
    wake()
  }

  function onPointerMove(event) {
    if (dragging && event.pointerId !== pointerId) return
    updatePointer(event)
    if (dragging) {
      rotationY += (event.clientX - lastX) * 0.007
      rotationX = THREE.MathUtils.clamp(rotationX + (event.clientY - lastY) * 0.005, -1.4, 1.4)
      pointerDistance = Math.max(pointerDistance, Math.hypot(event.clientX - downX, event.clientY - downY))
      if (pointerDistance > 6 && selectedView !== null) {
        selectedView = null
        onViewChange?.(null)
      }
      lastX = event.clientX
      lastY = event.clientY
    }
    wake()
  }

  function endPointer(event) {
    if (!dragging || event.pointerId !== pointerId) return
    const clicked = event.type === 'pointerup' && pointerDistance < 6
    dragging = false
    pointerId = null
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = 'grab'
    if (clicked) pulse()
    wake()
  }

  function leavePointer() {
    if (!dragging) hovered = false
    wake()
  }

  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      previousTime = 0
      wake()
    }
  }

  function motionPreferenceChanged(event) {
    if (event.matches) {
      paused = true
      activeUntil = 0
      if (compact) common.uExpand.value = expanded
      onPausedChange?.(true)
      requestRender()
    }
  }

  function lostContext(event) {
    event.preventDefault()
    contextLost = true
    cancelAnimationFrame(frame)
    frame = 0
    onError?.(new Error('그래픽 연결이 중단되었습니다. 새로고침하면 다시 시작할 수 있습니다.'))
  }

  function restoredContext() {
    contextLost = false
    previousTime = 0
    resize()
    if (photoReady) onReady?.({ particleCount: model.positions.length / 3 })
  }

  function render(now) {
    frame = 0
    if (destroyed || contextLost || document.hidden || !inView) return
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60
    previousTime = now
    const motionAllowed = !(compact && reducedMotion.matches)
    const moving = motionAllowed && (!paused || dragging || now < activeUntil)
    if (moving) elapsed += dt
    common.uTime.value = elapsed
    const damping = motionAllowed ? 1 - Math.exp(-dt * 7) : 1
    const previousExpansion = common.uExpand.value
    common.uExpand.value += (expanded - common.uExpand.value) * damping
    camera.position.z = restingCameraZ + common.uExpand.value * expansionCameraOffset
    if (motionAllowed && !paused && !dragging && now > introUntil) {
      rotationX += dt * 2
      rotationY += dt * 2
      if (selectedView !== null) {
        selectedView = null
        onViewChange?.(null)
      }
    }
    group.rotation.x += (rotationX - group.rotation.x) * damping
    group.rotation.y += (rotationY - group.rotation.y) * damping
    const age = elapsed - kickTime
    const kick = reducedMotion.matches ? 0 : Math.sin(age * 5.3) * Math.exp(-age * 2.3) * 0.11
    group.position.y = (reducedMotion.matches ? 0 : Math.sin(elapsed * 0.85) * 0.035) + kick
    uniforms.uHover.value.lerp(hoverTarget, damping)
    uniforms.uHoverStrength.value += ((hovered ? 1 : 0) - uniforms.uHoverStrength.value) * damping
    if (dust) dust.rotation.y = elapsed * 0.025
    renderer.render(scene, camera)
    const settling = Math.abs(previousExpansion - common.uExpand.value) > 0.00001
    if ((motionAllowed && (!paused || dragging || now < activeUntil)) || settling) requestRender()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting
    if (inView) {
      previousTime = 0
      wake()
    } else {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }, { rootMargin: '100px' })
  visibilityObserver.observe(canvas)
  const listeners = [
    ['webglcontextlost', lostContext], ['webglcontextrestored', restoredContext],
    ...(interactive ? [
      ['pointerdown', onPointerDown], ['pointermove', onPointerMove],
      ['pointerup', endPointer], ['pointercancel', endPointer], ['lostpointercapture', endPointer],
      ['pointerleave', leavePointer],
    ] : []),
  ]
  listeners.forEach(([name, handler]) => canvas.addEventListener(name, handler))
  document.addEventListener('visibilitychange', visibilityChanged)
  reducedMotion.addEventListener('change', motionPreferenceChanged)
  resize()
  loadReferencePhoto(`${import.meta.env.BASE_URL}football-reference.png`).then(photo => {
    if (destroyed) return
    const palette = createParticlePalette(geometry.attributes.position.array, inferred.colors, photo)
    geometry.attributes.aPrinted.array.set(palette.colors)
    geometry.attributes.aInk.array.set(palette.ink)
    geometry.attributes.aObserved.array.set(palette.observed)
    geometry.attributes.aPrinted.needsUpdate = true
    geometry.attributes.aInk.needsUpdate = true
    geometry.attributes.aObserved.needsUpdate = true
    photoReady = true
    introUntil = performance.now()
    if (!contextLost) onReady?.({ particleCount: model.positions.length / 3 })
    wake()
  }).catch(error => {
    if (!destroyed) onError?.(new Error(`참고 사진을 불러오지 못했습니다: ${error.message}`))
  })

  function selectView(back) {
    rotationX = 0
    const target = back ? Math.PI : 0
    rotationY = target + Math.PI * 2 * Math.round((group.rotation.y - target) / (Math.PI * 2))
    expanded = 0
    paused = true
    hovered = false
    onPausedChange?.(true)
    selectedView = back ? 'back' : 'front'
    onViewChange?.(selectedView)
    wake(1800)
  }

  return {
    setPaused(value) {
      paused = Boolean(value)
      activeUntil = 0
      previousTime = 0
      requestRender()
    },
    setAccent(value) { common.uAccent.value.set(value); wake() },
    setExpanded(value) {
      expanded = value ? 1 : 0
      if (compact && reducedMotion.matches) common.uExpand.value = expanded
      wake(1800)
    },
    showFront() { selectView(false) },
    showBack() { selectView(true) },
    pulse,
    reset() {
      rotationX = INITIAL_ROTATION.x
      rotationY = INITIAL_ROTATION.y
      expanded = 0
      common.uAccent.value.set(DEFAULT_ACCENT)
      hovered = false
      paused = reducedMotion.matches
      introUntil = performance.now() + 5000
      selectedView = 'front'
      onViewChange?.('front')
      pulse()
    },
    destroy() {
      destroyed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      listeners.forEach(([name, handler]) => canvas.removeEventListener(name, handler))
      document.removeEventListener('visibilitychange', visibilityChanged)
      reducedMotion.removeEventListener('change', motionPreferenceChanged)
      if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId)
      ;[geometry, material, seamGeometry, seamMaterial, ...sceneryResources].forEach(resource => resource.dispose())
      renderer.dispose()
    },
  }
}
