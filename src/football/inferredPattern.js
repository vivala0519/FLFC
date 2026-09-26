/**
 * An inferred reverse-side print, expressed in each physical panel's plane.
 * Colors are sRGB (not linear); the renderer owns color-space conversion.
 * Hexagonal ribbons connect across hexagon/hexagon edges, leaving ivory
 * pentagons surrounded by the cyan, navy, gold, and silver sports graphic.
 */
const rgb = (hex) => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];

const IVORY = rgb(0xeeefea);
const NAVY = rgb(0x102e3c);
const CYAN = rgb(0x009aca);
const GOLD = rgb(0xc8982d);
const SILVER = rgb(0x8b9493);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const normalize = (a) => {
  const length = Math.hypot(...a);
  return a.map((value) => value / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smoothstep = (low, high, value) => {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};

// Band positions are fractions of a hexagon's center-to-corner distance.
// White gaps and several finer outer stripes keep the print from becoming
// one solid Y. At typical particle densities, the fine stripes read as dots.
const RIBBON_BANDS = [
  [0.078, CYAN],
  [0.119, NAVY],
  [0.140, IVORY],
  [0.171, GOLD],
  [0.192, NAVY],
  [0.212, IVORY],
  [0.231, SILVER],
  [0.249, IVORY],
  [0.266, NAVY],
  [0.284, IVORY],
  [0.299, SILVER],
  [Infinity, IVORY],
];

function ribbonColor(distance) {
  const feather = 0.005;
  for (let i = 0; i < RIBBON_BANDS.length - 1; i += 1) {
    const [end, color] = RIBBON_BANDS[i];
    if (distance < end - feather) return color;
    if (distance <= end + feather) {
      const next = RIBBON_BANDS[i + 1][1];
      const blend = smoothstep(end - feather, end + feather, distance);
      return color.map((value, channel) => value + (next[channel] - value) * blend);
    }
  }
  return IVORY;
}

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function makePanelFrame(face) {
  const normal = normalize(face.normal);
  const center = [0, 0, 0];
  for (const vertex of face.vertices) {
    for (let i = 0; i < 3; i += 1) center[i] += vertex[i] / face.vertices.length;
  }
  const tangent = normalize(subtract(face.vertices[0], center));
  const bitangent = cross(normal, tangent);
  const panelRadius = Math.hypot(...subtract(face.vertices[0], center));
  const planeDistance = dot(normal, center);
  const project = (position) => {
    // Undo spherical projection to recover the panel's original print plane.
    const scale = planeDistance / dot(position, normal);
    const offset = position.map((value, axis) => value * scale - center[axis]);
    return [dot(offset, tangent) / panelRadius, dot(offset, bitangent) / panelRadius];
  };

  return { project, corners: face.vertices.map(project) };
}

/**
 * @param {ReturnType<import('./geometry.js').createFootballGeometry>} model
 * @returns {{ colors: Float32Array }} Three sRGB components for every point.
 * The print is deterministic and independent of world orientation or radius.
 */
export function createInferredPattern(model) {
  const colors = new Float32Array(model.count * 3);
  const edgeFaces = new Map();
  for (const face of model.faces) {
    const indices = face.vertexIndices;
    for (let i = 0; i < indices.length; i += 1) {
      const key = edgeKey(indices[i], indices[(i + 1) % indices.length]);
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key).push(face);
    }
  }

  for (const face of model.faces) {
    const { project, corners } = makePanelFrame(face);
    const spokes = [];
    if (face.type === 'hexagon') {
      for (let i = 0; i < corners.length; i += 1) {
        const key = edgeKey(face.vertexIndices[i], face.vertexIndices[(i + 1) % corners.length]);
        const neighbor = edgeFaces.get(key).find((candidate) => candidate !== face);
        if (neighbor?.type !== 'hexagon') continue;
        const next = corners[(i + 1) % corners.length];
        const midpoint = [(corners[i][0] + next[0]) / 2, (corners[i][1] + next[1]) / 2];
        const length = Math.hypot(...midpoint);
        spokes.push({ direction: midpoint.map((value) => value / length), length });
      }
    }

    for (let index = face.pointStart; index < face.pointStart + face.pointCount; index += 1) {
      const offset = index * 3;
      const point = [model.positions[offset], model.positions[offset + 1], model.positions[offset + 2]];
      const [x, y] = project(point);
      let color = IVORY;

      if (face.type === 'hexagon') {
        let nearestRibbon = Infinity;
        for (const { direction, length } of spokes) {
          const along = x * direction[0] + y * direction[1];
          // Behind a spoke's origin, use distance to its tip; another spoke
          // then owns that sector. This joins the three ribbons cleanly.
          const t = clamp(along / length);
          const bend = Math.sin(t * Math.PI) ** 2 * 0.025;
          const across = x * -direction[1] + y * direction[0] - bend;
          const distance = along < 0 ? Math.hypot(along, across) : Math.abs(across);
          const taper = 0.78 + 0.22 * smoothstep(0, 0.72, t);
          nearestRibbon = Math.min(nearestRibbon, distance / taper);
        }
        color = ribbonColor(nearestRibbon);
      } else {
        // A restrained double pinstripe frames the white pentagons, with
        // their broad centers deliberately clear rather than dark patches.
        let edgeDistance = Infinity;
        for (let i = 0; i < corners.length; i += 1) {
          const a = corners[i];
          const b = corners[(i + 1) % corners.length];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          edgeDistance = Math.min(edgeDistance, Math.abs(dx * (y - a[1]) - dy * (x - a[0])) / Math.hypot(dx, dy));
        }
        const silverInk = 1 - smoothstep(0.004, 0.010, Math.abs(edgeDistance - 0.072));
        const navyInk = 1 - smoothstep(0.003, 0.008, Math.abs(edgeDistance - 0.111));
        const ink = Math.max(silverInk, navyInk * 0.60);
        const stripeColor = navyInk > silverInk ? NAVY : SILVER;
        color = IVORY.map((value, channel) => value + (stripeColor[channel] - value) * ink);
      }

      colors.set(color, offset);
    }
  }

  return { colors };
}
