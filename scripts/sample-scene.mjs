// Procedural sample image: a ringed gas giant with a small moon, stars and a
// nebula. Long spherical gradients, warm bands and cool atmosphere, fine
// detail in the rings and stars. Deterministic, so the sample and every
// preview derived from it can be regenerated exactly. The animation keeps the
// planet still and turns the rings (inner ringlets faster than outer ones), a
// shepherd moon runs along the Encke gap and the moon completes its orbit;
// every pattern is back in place after one loop.

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => {
  const k = clamp01(t);
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
};
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const hash = (i, j) => {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
const vnoise = (x, y) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const a = hash(i, j);
  const b = hash(i + 1, j);
  const c = hash(i, j + 1);
  const d = hash(i + 1, j + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
const fbm = (x, y) => {
  let s = 0;
  let a = 0.5;
  for (let o = 0; o < 5; o++) {
    s += a * vnoise(x, y);
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / 0.96875;
};
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const normalize = ([x, y, z]) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};

// Scene layout, in frame units: x from -A/2 to A/2 (A = aspect), y from 0 to 1.
const PLANET = { x: 0.42, y: 0.74, r: 0.5 };
const TILT = -0.22;
const COS = Math.cos(TILT);
const SIN = Math.sin(TILT);
const LIGHT = normalize([-0.85, -0.35, 0.42]);
const LIGHT_2D = (() => {
  const l = Math.hypot(LIGHT[0], LIGHT[1]);
  return [LIGHT[0] / l, LIGHT[1] / l];
})();
const BANDS = [
  [247, 233, 205],
  [224, 181, 130],
  [186, 116, 74],
  [150, 88, 60],
  [238, 210, 166],
];
const STORMS = [
  {
    lon: 0,
    lat: 0.36,
    w: 0.3,
    h: 0.085,
    color: [206, 84, 54],
    rim: [242, 196, 156],
  },
  { lon: 2.3, lat: -0.46, w: 0.13, h: 0.045, color: [250, 242, 228] },
  { lon: 4.1, lat: 0.62, w: 0.11, h: 0.04, color: [250, 242, 228] },
];
const CRATERS = [
  [-0.35, -0.25, 0.28],
  [0.3, 0.2, 0.22],
  [0.05, -0.55, 0.16],
  [-0.2, 0.5, 0.18],
  [0.55, -0.3, 0.12],
  [-0.6, 0.15, 0.1],
  [0.15, 0.62, 0.1],
  [0.62, 0.45, 0.08],
];

function space(px, py) {
  let c = [3, 5, 12];
  const w = Math.exp(-(((px + 0.38) / 0.72) ** 2 + ((py - 0.3) / 0.44) ** 2));
  if (w > 0.01) {
    const q = fbm(px * 1.3 + 2, py * 1.3 - 1);
    const n = fbm(px * 2.4 + q * 1.4 + 7, py * 2.4 + q * 1.4 + 3);
    let nebula = mix(
      [118, 26, 92],
      [22, 110, 130],
      fbm(px * 1.7 - 4, py * 1.7 + 8),
    );
    nebula = mix(
      nebula,
      [168, 90, 44],
      smooth(0.62, 0.8, fbm(px * 3 + 1, py * 3 + 2)) * 0.6,
    );
    const dust = smooth(0.52, 0.72, fbm(px * 5.5 + 9, py * 5.5 - 3));
    c = mix(c, nebula, smooth(0.3, 0.85, n) * w * 1.25 * (1 - 0.75 * dust));
  }
  // Stars on a fixed grid (320 cells per frame height), so their density
  // doesn't depend on the output size.
  const sx = (px + 0.75) * 320;
  const sy = py * 320;
  const gx = Math.floor(sx);
  const gy = Math.floor(sy);
  if (hash(gx * 1.37, gy * 2.11) > 0.984) {
    const ox = 0.2 + 0.6 * hash(gx + 5, gy);
    const oy = 0.2 + 0.6 * hash(gx, gy + 7);
    const mag = hash(gx + 11, gy + 3) ** 3;
    const d2 = (sx - gx - ox) ** 2 + (sy - gy - oy) ** 2;
    const glow = (0.35 + 0.65 * mag) * Math.exp(-d2 / (0.06 + 0.3 * mag));
    const tint = hash(gx + 3, gy) > 0.5 ? [205, 218, 255] : [255, 226, 192];
    c = c.map((v, i) => v + tint[i] * glow * 1.3);
  }
  return c;
}

/** Position in the ring plane: radius (0.56–1 is the ring) and angle. */
function ringCoords(dx, dy) {
  const lx = dx * COS + dy * SIN;
  const ly = -dx * SIN + dy * COS;
  const u = lx / (PLANET.r * 2.15);
  const v = ly / (PLANET.r * 0.42);
  return { rho: Math.hypot(u, v), ly, phi: Math.atan2(v, u) };
}

function ringDensity(rho, phi, t) {
  let d =
    0.52 +
    0.22 * Math.sin(rho * 95) +
    0.14 * Math.sin(rho * 241 + 1.3) +
    0.24 * (vnoise(rho * 520, 1.7) - 0.5);
  // The inner ring moves two pattern periods per loop, the outer one.
  const inner = rho < 0.8;
  const m = inner ? 12 : 16;
  const psi = phi - (t * TAU * (inner ? 2 : 1)) / m;
  d *=
    1 +
    0.45 *
      (0.6 * Math.sin(m * psi + rho * 11) +
        0.4 * Math.sin(2 * m * psi + rho * 23 + 1));
  if (inner) {
    const spoke =
      Math.exp(-((Math.sin((m / 2) * psi + 0.6) - 0.85) ** 2) / 0.004) *
      smooth(0.62, 0.7, rho) *
      (1 - smooth(0.74, 0.79, rho));
    d *= 1 - 0.7 * spoke;
  }
  d *= smooth(0.56, 0.62, rho) * (1 - smooth(0.965, 1, rho));
  if (Math.abs(rho - 0.8) < 0.021) d *= 0.07; // Cassini division
  if (Math.abs(rho - 0.925) < 0.005) d *= 0.2; // Encke gap
  return clamp01(d);
}

function ringOver(c, rho, phi, dx, dy, t) {
  let color = mix(
    [238, 220, 188],
    [192, 160, 122],
    smooth(0.6, 0.97, rho) + 0.18 * Math.sin(rho * 37),
  );
  // The planet's shadow falls across the ring behind it.
  const along = -(dx * LIGHT_2D[0] + dy * LIGHT_2D[1]);
  const across = Math.abs(dx * LIGHT_2D[1] - dy * LIGHT_2D[0]);
  if (along > 0 && across < PLANET.r * 0.98) color = color.map((v) => v * 0.16);
  return mix(c, color, ringDensity(rho, phi, t) * 0.92);
}

function planet(dx, dy, d, t) {
  const nx = dx / PLANET.r;
  const ny = dy / PLANET.r;
  const nz = Math.sqrt(Math.max(0, 1 - d * d));
  // Bands follow the ring's tilt.
  const lat = Math.asin(Math.max(-1, Math.min(1, ny * COS - nx * SIN)));
  const lon = Math.atan2(nx * COS + ny * SIN, nz);
  const turbulence =
    0.35 * Math.sin(3 * lon + lat * 9) +
    0.2 * Math.sin(5 * lon - lat * 13 + 1) +
    0.12 * Math.sin(9 * lon + lat * 21 + 2) +
    0.08 * Math.sin(14 * lon + lat * 33);
  const tone =
    0.5 +
    0.5 *
      Math.sin(
        lat * 16 +
          1.4 * Math.sin(lat * 5.3) +
          turbulence +
          1.4 * (vnoise(lat * 14 + 3, 0.5) - 0.5),
      );
  const k = tone * 4;
  const i0 = Math.min(3, Math.floor(k));
  let color = mix(BANDS[i0], BANDS[i0 + 1], k - i0);
  color = mix(color, [150, 162, 176], smooth(0.85, 1.25, Math.abs(lat)));
  for (const storm of STORMS) {
    const e =
      (wrapAngle(lon - storm.lon) / storm.w) ** 2 +
      ((lat - storm.lat) / storm.h) ** 2;
    if (e < 4) {
      if (storm.rim)
        color = mix(
          color,
          storm.rim,
          Math.exp(-((Math.sqrt(e) - 1.1) ** 2) / 0.08) * 0.7,
        );
      color = mix(color, storm.color, Math.exp(-e * 1.2) * 0.95);
    }
  }
  color = color.map((v) => v * (0.6 + 0.4 * nz ** 0.6)); // limb darkening
  const lambert = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
  const lit = smooth(-0.1, 0.4, lambert);
  // The ring's shadow on the face: the ring, shifted downstream of the light.
  const shadow = ringCoords(dx - 0.03, dy - 0.09);
  const shade =
    shadow.rho > 0.56 && shadow.rho < 1
      ? 1 - 0.55 * ringDensity(shadow.rho, shadow.phi, t)
      : 1;
  color = color.map((v) => v * (0.025 + 0.975 * lit * shade));
  const fresnel = (1 - nz) ** 2.5 * Math.max(0, lambert + 0.25);
  return mix(color, [120, 175, 255], fresnel * 0.7);
}

function moon(px, py, c, body) {
  const ex = (px - body.x) / body.r;
  const ey = (py - body.y) / body.r;
  const q = ex * ex + ey * ey;
  if (q >= 1) return c;
  const nz = Math.sqrt(1 - q);
  let albedo =
    0.72 * (1 - 0.28 * smooth(0.5, 0.7, fbm(ex * 2 + 11, ey * 2 + 5)));
  for (const [cx, cy, r] of CRATERS) {
    const ddx = ex - cx;
    const ddy = ey - cy;
    const dd = Math.hypot(ddx, ddy) / r;
    if (dd < 1.08) {
      const facing =
        (ddx * -LIGHT_2D[0] + ddy * -LIGHT_2D[1]) / (Math.hypot(ddx, ddy) || 1);
      albedo *= dd < 0.82 ? 0.84 + 0.1 * facing : 1 - 0.18 * facing;
    }
  }
  const lambert = ex * LIGHT[0] + ey * LIGHT[1] + nz * LIGHT[2];
  const v = 255 * albedo * (0.03 + 0.97 * smooth(-0.05, 0.5, lambert));
  return [v * 1.02, v, v * 0.95];
}

/** An orbit around the planet in the ring plane; `behind` when far side. */
function orbiter(angle, rx, ry, r) {
  const x = rx * Math.cos(angle);
  const y = ry * Math.sin(angle);
  return {
    x: PLANET.x + x * COS - y * SIN,
    y: PLANET.y + x * SIN + y * COS,
    r,
    behind: Math.sin(angle) < 0,
  };
}

function sceneSample(px, py, base, t) {
  const moonBody = orbiter(Math.PI * 1.3 + t * TAU, 1.25, 0.34, 0.045);
  const shepherd = orbiter(
    0.5 + t * TAU,
    0.925 * PLANET.r * 2.15,
    0.925 * PLANET.r * 0.42,
    0.011,
  );
  let c = base;
  if (moonBody.behind) c = moon(px, py, c, moonBody);
  if (shepherd.behind) c = moon(px, py, c, shepherd);
  const dx = px - PLANET.x;
  const dy = py - PLANET.y;
  const d = Math.hypot(dx, dy) / PLANET.r;
  const { rho, ly, phi } = ringCoords(dx, dy);
  const inRing = rho > 0.56 && rho < 1;
  if (d >= 1 && d < 1.1) {
    // Atmospheric halo, brighter on the lit side.
    const facing = Math.max(
      0,
      (dx * LIGHT_2D[0] + dy * LIGHT_2D[1]) / (Math.hypot(dx, dy) || 1),
    );
    const g = Math.exp(-(d - 1) / 0.018) * (0.15 + 0.85 * facing) * 0.55;
    c = [c[0] + 110 * g, c[1] + 165 * g, c[2] + 255 * g];
  }
  if (inRing && ly < 0 && d >= 1) c = ringOver(c, rho, phi, dx, dy, t);
  if (d < 1) c = planet(dx, dy, d, t);
  if (inRing && ly >= 0) c = ringOver(c, rho, phi, dx, dy, t);
  if (!shepherd.behind) c = moon(px, py, c, shepherd);
  if (!moonBody.behind) c = moon(px, py, c, moonBody);
  return c;
}

/** The static starfield and nebula, averaged over samples² points per pixel. */
function background(width, height, samples) {
  const aspect = width / height;
  const out = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < samples; j++) {
        for (let i = 0; i < samples; i++) {
          const c = space(
            ((x + (i + 0.5) / samples) / width) * aspect - aspect / 2,
            (y + (j + 0.5) / samples) / height,
          );
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const k = (y * width + x) * 3;
      const n = samples * samples;
      out[k] = r / n;
      out[k + 1] = g / n;
      out[k + 2] = b / n;
    }
  }
  return out;
}

function frame(width, height, t, bg, samples) {
  const aspect = width / height;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = (y * width + x) * 3;
      const base = [bg[k], bg[k + 1], bg[k + 2]];
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < samples; j++) {
        for (let i = 0; i < samples; i++) {
          const c = sceneSample(
            ((x + (i + 0.5) / samples) / width) * aspect - aspect / 2,
            (y + (j + 0.5) / samples) / height,
            base,
            t,
          );
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const o = (y * width + x) * 4;
      const n = samples * samples;
      data[o] = Math.round(r / n);
      data[o + 1] = Math.round(g / n);
      data[o + 2] = Math.round(b / n);
      data[o + 3] = 255;
    }
  }
  return { data, width, height };
}

/**
 * @param {number} width
 * @param {number} height
 * @param {{ t?: number, samples?: number }} [options] `t` is the animation
 *   phase (0–1, one loop); `samples` the antialiasing samples per pixel side.
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }} RGBA pixels
 */
export function makeSampleScene(width, height, { t = 0, samples = 2 } = {}) {
  return frame(width, height, t, background(width, height, samples), samples);
}

/** Every frame of one seamless loop (the static background is drawn once). */
export function makeSampleAnimation(
  width,
  height,
  frames,
  { samples = 2 } = {},
) {
  const bg = background(width, height, samples);
  return Array.from({ length: frames }, (_, f) =>
    frame(width, height, f / frames, bg, samples),
  );
}
