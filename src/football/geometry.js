/**
 * A football is a truncated icosahedron: 12 pentagons and 20 hexagons.
 * The topology is built in flat space, then samples are projected onto a sphere.
 * No rendering library is required, so the same geometry also works with WebGL.
 */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (vector, amount) => vector.map((value) => value * amount);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (vector) => Math.hypot(...vector);
const normalize = (vector) => scale(vector, 1 / length(vector));
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const average = (vectors) => scale(vectors.reduce(add, [0, 0, 0]), 1 / vectors.length);

function orderFace(indices, vertices) {
  const center = average(indices.map((index) => vertices[index]));
  const normal = normalize(center);
  const tangent = normalize(subtract(vertices[indices[0]], center));
  const bitangent = cross(normal, tangent);

  return [...indices].sort((a, b) => {
    const aOffset = subtract(vertices[a], center);
    const bOffset = subtract(vertices[b], center);
    return (
      Math.atan2(dot(aOffset, bitangent), dot(aOffset, tangent)) -
      Math.atan2(dot(bOffset, bitangent), dot(bOffset, tangent))
    );
  });
}

function makeTopology() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const icosahedron = [];
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      icosahedron.push([0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a]);
    }
  }

  const neighbors = icosahedron.map(() => []);
  for (let a = 0; a < icosahedron.length; a += 1) {
    for (let b = a + 1; b < icosahedron.length; b += 1) {
      const delta = subtract(icosahedron[a], icosahedron[b]);
      if (Math.abs(dot(delta, delta) - 4) < 1e-8) {
        neighbors[a].push(b);
        neighbors[b].push(a);
      }
    }
  }

  // Each directed icosahedron edge owns one vertex at its one-third point.
  const vertices = [];
  const directedEdges = new Map();
  for (let a = 0; a < icosahedron.length; a += 1) {
    for (const b of neighbors[a]) {
      directedEdges.set(`${a}:${b}`, vertices.length);
      vertices.push(scale(add(scale(icosahedron[a], 2), icosahedron[b]), 1 / 3));
    }
  }

  const panels = neighbors.map((adjacent, a) => ({
    type: 'pentagon',
    vertexIndices: orderFace(adjacent.map((b) => directedEdges.get(`${a}:${b}`)), vertices),
  }));

  // Every triangular icosahedron face becomes a hexagon after truncation.
  for (let a = 0; a < icosahedron.length; a += 1) {
    for (const b of neighbors[a]) {
      if (b <= a) continue;
      for (const c of neighbors[b]) {
        if (c <= b || !neighbors[a].includes(c)) continue;
        const corners = [
          directedEdges.get(`${a}:${b}`),
          directedEdges.get(`${b}:${a}`),
          directedEdges.get(`${b}:${c}`),
          directedEdges.get(`${c}:${b}`),
          directedEdges.get(`${c}:${a}`),
          directedEdges.get(`${a}:${c}`),
        ];
        panels.push({ type: 'hexagon', vertexIndices: orderFace(corners, vertices) });
      }
    }
  }

  return { vertices: vertices.map(normalize), panels };
}

function seedFor(index) {
  // Integer hashing makes re-renders and screenshots reproduce exactly.
  let value = (index + 1) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

/**
 * @param {{radius?: number, spacing?: number}} options
 * @returns {{
 *   positions: Float32Array, normals: Float32Array, panelTypes: Float32Array,
 *   seam: Float32Array, seeds: Float32Array, edges: Float32Array,
 *   faces: Array, vertices: Array, count: number, edgeCount: number, radius: number
 * }}
 * positions/normals are vec3 buffers; panelTypes/seam/seeds are scalar buffers.
 * panelTypes is 1 for pentagons, 0 for hexagons. seam runs from 0 at a panel's
 * center to 1 at its boundary. edges contains independent spherical line pairs.
 * faces contains topology plus each panel's contiguous pointStart/pointCount.
 */
export function createFootballGeometry({ radius = 1.65, spacing = 0.025 } = {}) {
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('Football radius must be a positive finite number.');
  }
  if (!Number.isFinite(spacing) || spacing <= 0) {
    throw new RangeError('Football spacing must be a positive finite number.');
  }

  const topology = makeTopology();
  const positions = [];
  const normals = [];
  const panelTypes = [];
  const seam = [];
  const seeds = [];
  const edges = [];
  const uniqueEdges = new Set();

  const faces = topology.panels.map((panel, faceIndex) => {
    const corners = panel.vertexIndices.map((index) => topology.vertices[index]);
    const flatCenter = average(corners);
    const centerNormal = normalize(flatCenter);
    const edgeNormals = corners.map((corner, index) => {
      const edgeNormal = normalize(cross(corner, corners[(index + 1) % corners.length]));
      return dot(edgeNormal, centerNormal) < 0 ? scale(edgeNormal, -1) : edgeNormal;
    });
    const centerEdgeDistance = Math.min(
      ...edgeNormals.map((normal) => Math.asin(clamp(dot(normal, centerNormal), 0, 1))),
    );
    const pointStart = panelTypes.length;
    const visited = new Set();

    for (let cornerIndex = 0; cornerIndex < corners.length; cornerIndex += 1) {
      const a = corners[cornerIndex];
      const b = corners[(cornerIndex + 1) % corners.length];
      const arcLength = Math.acos(clamp(dot(a, b), -1, 1)) * radius;
      const subdivisions = Math.max(1, Math.ceil(arcLength / spacing));

      // Barycentric lattices tile a panel as a fan, then become curved on the ball.
      for (let row = 0; row <= subdivisions; row += 1) {
        for (let column = 0; column <= subdivisions - row; column += 1) {
          const aWeight = row / subdivisions;
          const bWeight = column / subdivisions;
          const centerWeight = 1 - aWeight - bWeight;
          const direction = normalize([
            flatCenter[0] * centerWeight + a[0] * aWeight + b[0] * bWeight,
            flatCenter[1] * centerWeight + a[1] * aWeight + b[1] * bWeight,
            flatCenter[2] * centerWeight + a[2] * aWeight + b[2] * bWeight,
          ]);
          const key = direction.map((value) => Math.round(value * 1e7)).join(':');
          if (visited.has(key)) continue;
          visited.add(key);

          const edgeDistance = Math.min(
            ...edgeNormals.map((normal) => Math.asin(clamp(dot(normal, direction), 0, 1))),
          );
          positions.push(...scale(direction, radius));
          normals.push(...direction);
          panelTypes.push(panel.type === 'pentagon' ? 1 : 0);
          seam.push(clamp(1 - edgeDistance / centerEdgeDistance, 0, 1));
          seeds.push(seedFor(panelTypes.length + faceIndex * 100003));
        }
      }

      const first = panel.vertexIndices[cornerIndex];
      const second = panel.vertexIndices[(cornerIndex + 1) % corners.length];
      const edgeKey = first < second ? `${first}:${second}` : `${second}:${first}`;
      if (!uniqueEdges.has(edgeKey)) {
        uniqueEdges.add(edgeKey);
        const angle = Math.acos(clamp(dot(a, b), -1, 1));
        const sine = Math.sin(angle);
        const arcSteps = Math.max(6, subdivisions);
        const onArc = (amount) => scale(
          add(
            scale(a, Math.sin((1 - amount) * angle) / sine),
            scale(b, Math.sin(amount * angle) / sine),
          ),
          radius,
        );
        for (let step = 0; step < arcSteps; step += 1) {
          edges.push(...onArc(step / arcSteps), ...onArc((step + 1) / arcSteps));
        }
      }
    }

    return {
      index: faceIndex,
      type: panel.type,
      vertexIndices: panel.vertexIndices,
      vertices: corners.map((corner) => scale(corner, radius)),
      center: scale(centerNormal, radius),
      normal: centerNormal,
      pointStart,
      pointCount: panelTypes.length - pointStart,
    };
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    panelTypes: new Float32Array(panelTypes),
    seam: new Float32Array(seam),
    seeds: new Float32Array(seeds),
    edges: new Float32Array(edges),
    faces,
    vertices: topology.vertices.map((vertex) => scale(vertex, radius)),
    count: panelTypes.length,
    edgeCount: uniqueEdges.size,
    radius,
  };
}
