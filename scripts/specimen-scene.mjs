// Procedural algorithm specimen: an 1980s CRT terminal on a checkered table in
// a dark studio, raymarched. Glowing lines of text on the curved screen are
// the fine detail, the beige case and its soft shadow the gradients, and the
// black void and floor squares the deep shadows, so the image spans the full
// tonal range. Rendered in grayscale, since the algorithm previews are 1-bit.
// Deterministic, so every preview derived from it can be regenerated exactly.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = ([x, y, z]) => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const hash = (i, j) => {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
const length3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const smin = (a, b, k) => {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b + (a - b) * h - k * h * (1 - h);
};

// Signed distance functions.
const sdSphere = (x, y, z, r) => length3(x, y, z) - r;
const sdRoundBox = (x, y, z, bx, by, bz, r) => {
  const qx = Math.abs(x) - bx + r;
  const qy = Math.abs(y) - by + r;
  const qz = Math.abs(z) - bz + r;
  return (
    length3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
    Math.min(Math.max(qx, qy, qz), 0) -
    r
  );
};
const sdCylinderZ = (x, y, z, r, h) => {
  const dx = Math.hypot(x, y) - r;
  const dz = Math.abs(z) - h;
  return (
    Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0))
  );
};

// The terminal, turned three-quarters toward the camera.
const TURN = -0.45;
const TURN_COS = Math.cos(TURN);
const TURN_SIN = Math.sin(TURN);

function terminalParts(wx, y, wz) {
  const x = wx * TURN_COS - wz * TURN_SIN;
  const z = wx * TURN_SIN + wz * TURN_COS;
  let body = sdRoundBox(x, y - 0.44, z, 0.44, 0.33, 0.34, 0.05);
  body = smin(
    body,
    sdRoundBox(x, y - 0.42, z + 0.3, 0.31, 0.25, 0.22, 0.06),
    0.06,
  ); // tube housing
  body = Math.max(
    body,
    -sdRoundBox(x, y - 0.47, z - 0.37, 0.35, 0.26, 0.06, 0.03),
  ); // screen recess
  body = Math.min(
    body,
    sdRoundBox(x, y - 0.045, z - 0.05, 0.3, 0.045, 0.27, 0.02),
  ); // foot
  body = Math.min(
    body,
    sdCylinderZ(x - 0.33, y - 0.14, z - 0.38, 0.03, 0.02),
    sdCylinderZ(x - 0.24, y - 0.14, z - 0.38, 0.03, 0.02),
  ); // knobs
  // Curved glass: a large sphere clipped to the screen opening.
  const screen = Math.max(
    sdSphere(x, y - 0.47, z + 1.6, 1.97),
    Math.abs(x) - 0.33,
    Math.abs(y - 0.47) - 0.24,
  );
  return { body, screen, x, y };
}

const distance = (x, y, z) => {
  const p = terminalParts(x, y, z);
  return Math.min(p.body, p.screen);
};

function material(x, y, z) {
  const p = terminalParts(x, y, z);
  if (p.screen > p.body)
    return { albedo: 0.74, spec: 0.25, shine: 20, reflect: 0, emit: 0 };
  // Eight lines of glowing text and a cursor.
  const row = Math.floor((0.66 - p.y) / 0.052);
  const inRow = (0.66 - p.y) / 0.052 - row;
  const u = (p.x + 0.28) / 0.56;
  let emit = 0.015;
  if (row >= 0 && row < 8 && inRow > 0.22 && inRow < 0.78 && u > 0) {
    const lineLength = row === 7 ? 0.06 : 0.25 + 0.7 * hash(row, 3.1);
    if (
      u < lineLength &&
      (u * 30) % 1 < 0.72 &&
      hash(Math.floor(u * 30), row) > 0.18
    )
      emit = 0.9;
  }
  emit *= 0.85 + 0.15 * Math.sin(p.y * 420); // scanlines
  return { albedo: 0.04, spec: 0.9, shine: 70, reflect: 0.12, emit };
}

const LIGHT = normalize([-0.55, 0.75, 0.45]);
const BOUND_CENTER = [0, 0.5, 0];
const BOUND_RADIUS = 0.98;
const BACK = 0.015;
// A near-black void with a narrow glow on the horizon.
const backdrop = (dy) =>
  0.002 + 0.03 * Math.exp(-((Math.max(0, dy) / 0.008) ** 2));

function hitBound(o, d) {
  const ox = o[0] - BOUND_CENTER[0];
  const oy = o[1] - BOUND_CENTER[1];
  const oz = o[2] - BOUND_CENTER[2];
  const b = ox * d[0] + oy * d[1] + oz * d[2];
  const disc =
    b * b - (ox * ox + oy * oy + oz * oz - BOUND_RADIUS * BOUND_RADIUS);
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  return [-b - s, -b + s];
}

function softShadow(p) {
  if (!hitBound(p, LIGHT)) return 1;
  let result = 1;
  let t = 0.02;
  for (let i = 0; i < 48 && t < 2.6; i++) {
    const h = distance(
      p[0] + LIGHT[0] * t,
      p[1] + LIGHT[1] * t,
      p[2] + LIGHT[2] * t,
    );
    result = Math.min(result, (10 * h) / t);
    if (result < 0.002) return 0;
    t += Math.min(0.2, Math.max(0.012, h));
  }
  return clamp01(result);
}

function normalAt(p) {
  const e = 0.0015;
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (const [a, b, c] of [
    [1, -1, -1],
    [-1, -1, 1],
    [-1, 1, -1],
    [1, 1, 1],
  ]) {
    const v = distance(p[0] + a * e, p[1] + b * e, p[2] + c * e);
    nx += a * v;
    ny += b * v;
    nz += c * v;
  }
  return normalize([nx, ny, nz]);
}

function occlusion(p, n) {
  let occ = 0;
  let scale = 1;
  for (let i = 1; i <= 5; i++) {
    const h = 0.03 * i;
    occ +=
      (h - distance(p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h)) * scale;
    scale *= 0.8;
  }
  return clamp01(1 - 2.2 * occ);
}

const EYE = [0, 1.25, 3.3];

/** Linear radiance along one camera ray. */
function shade(dir) {
  let tObject = Infinity;
  const bound = hitBound(EYE, dir);
  if (bound && bound[1] > 0) {
    let t = Math.max(0, bound[0]);
    for (let i = 0; i < 110 && t < bound[1]; i++) {
      const d = distance(
        EYE[0] + dir[0] * t,
        EYE[1] + dir[1] * t,
        EYE[2] + dir[2] * t,
      );
      if (d < 0.0006) {
        tObject = t;
        break;
      }
      t += d;
    }
  }
  const tFloor = dir[1] < 0 ? -EYE[1] / dir[1] : Infinity;
  if (tObject < tFloor) {
    const p = [
      EYE[0] + dir[0] * tObject,
      EYE[1] + dir[1] * tObject,
      EYE[2] + dir[2] * tObject,
    ];
    const n = normalAt(p);
    const m = material(p[0], p[1], p[2]);
    const diffuse = Math.max(0, dot(n, LIGHT));
    const shadow =
      diffuse > 0
        ? softShadow([
            p[0] + n[0] * 0.003,
            p[1] + n[1] * 0.003,
            p[2] + n[2] * 0.003,
          ])
        : 0;
    const half = normalize([
      LIGHT[0] - dir[0],
      LIGHT[1] - dir[1],
      LIGHT[2] - dir[2],
    ]);
    const spec = Math.max(0, dot(n, half)) ** m.shine * m.spec * shadow;
    const fresnel = (1 - Math.max(0, -dot(n, dir))) ** 4 * 0.12;
    let env = 0;
    if (m.reflect) {
      const k = 2 * dot(dir, n);
      const r = [dir[0] - k * n[0], dir[1] - k * n[1], dir[2] - k * n[2]];
      env =
        r[1] < 0
          ? 0.12
          : backdrop(r[1]) + 1.2 * Math.max(0, dot(r, LIGHT)) ** 90;
    }
    return (
      m.albedo * (0.05 * occlusion(p, n) + 0.95 * diffuse * shadow) +
      spec +
      fresnel +
      m.reflect * env +
      m.emit
    );
  }
  if (tFloor < Infinity) {
    const x = EYE[0] + dir[0] * tFloor;
    const z = EYE[2] + dir[2] * tFloor;
    const checker = (Math.floor(x / 0.4) + Math.floor(z / 0.4)) & 1;
    const albedo = checker ? 0.7 : 0.008;
    const contact = clamp01(0.3 + distance(x, 0, z) * 2.6);
    const color =
      albedo * (0.05 * contact + 0.95 * LIGHT[1] * softShadow([x, 0.002, z]));
    return color + (BACK - color) * smooth(3, 14, tFloor);
  }
  return backdrop(dir[1]);
}

/**
 * @param {number} size Square side in pixels.
 * @param {{ samples?: number }} [options] Antialiasing samples per pixel side.
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }} RGBA pixels
 */
export function makeSpecimen(size, { samples = 3 } = {}) {
  const target = [0, 0.46, 0];
  const forward = normalize([
    target[0] - EYE[0],
    target[1] - EYE[1],
    target[2] - EYE[2],
  ]);
  const right = [-forward[2], 0, forward[0]].map(
    (v) => v / Math.hypot(forward[0], forward[2]),
  );
  const up = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  const tanHalf = Math.tan((30 * Math.PI) / 360);
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let j = 0; j < samples; j++) {
        for (let i = 0; i < samples; i++) {
          const u = ((x + (i + 0.5) / samples) / size) * 2 - 1;
          const v = 1 - ((y + (j + 0.5) / samples) / size) * 2;
          const dir = normalize([
            forward[0] + (right[0] * u + up[0] * v) * tanHalf,
            forward[1] + (right[1] * u + up[1] * v) * tanHalf,
            forward[2] + (right[2] * u + up[2] * v) * tanHalf,
          ]);
          sum += clamp01(shade(dir)) ** (1 / 2.2);
        }
      }
      const o = (y * size + x) * 4;
      const g = Math.round((sum / (samples * samples)) * 255);
      data[o] = g;
      data[o + 1] = g;
      data[o + 2] = g;
      data[o + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}
