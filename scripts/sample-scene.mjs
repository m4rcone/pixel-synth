// Procedural sample image: a synthwave sunset in the site's colors. A long
// sky gradient from the screen's near-black through navy and violet to a warm
// horizon, thin clouds lit from below, a striped sun in the accent yellow with
// a white-hot core, ridged mountains with a magenta rim, and a glossy floor
// that reflects the sky (tinted teal) under a grid in the text's blue-white.
// The warm band and the teal keep every hue in play, so palettes show what
// they do. Lit in high dynamic range, with bloom and a filmic tone curve, so
// the lights reach white and the night sky black: the image spans the full
// tonal range. Deterministic, so the sample and every preview derived from it
// can be regenerated exactly.
//
// The animation rolls the grid toward the camera by one cell, moves the sun's
// stripes down by one period, drifts the clouds and ripples the reflection;
// everything is back in place after one loop.

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
const add = (a, b, k = 1) => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
  a[2] + b[2] * k,
];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);
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
const fbm = (x, y, octaves = 5) => {
  let s = 0;
  let a = 0.5;
  let n = 0;
  for (let o = 0; o < octaves; o++) {
    s += a * vnoise(x, y);
    n += a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / n;
};
// Noise sampled on a circle in time, so it loops once per animation cycle.
const loopNoise = (x, y, t, r, octaves) =>
  fbm(x + r * Math.cos(TAU * t), y + r * Math.sin(TAU * t), octaves);

// Frame units: x from -A/2 to A/2 (A = aspect), y from 0 (top) to 1.
const SUN = { x: 0, y: 0.43, r: 0.19 };
const HORIZON = 0.6;
const CLOUDS = [
  [0.2, 0.035, 1],
  [0.3, 0.03, 2],
  [0.47, 0.025, 3],
];

function sky(px, py, t) {
  let c = mix([4, 7, 14], [16, 30, 62], smooth(0, 0.3, py));
  c = mix(c, [66, 50, 124], smooth(0.22, 0.48, py));
  c = mix(c, [232, 108, 92], smooth(0.44, HORIZON, py));
  c = mix(c, [255, 198, 118], smooth(0.56, HORIZON, py) * 0.8);
  const d = Math.hypot(px - SUN.x, py - SUN.y);
  c = add(c, [255, 190, 90], Math.exp(-d / 0.09) * 0.9);
  c = add(c, [150, 70, 160], Math.exp(-d / 0.35) * 0.35);
  // Stars in the high sky, on a fixed grid (200 cells per frame height).
  const gx = Math.floor((px + 0.8) * 200);
  const gy = Math.floor(py * 200);
  if (py < 0.3 && hash(gx, gy) > 0.993) {
    c = add(c, [207, 230, 255], 0.9 * (1 - py / 0.3) * hash(gx + 1, gy));
  }
  // The sun, with stripes (gaps) in its lower half.
  if (d < SUN.r) {
    const k = (py - (SUN.y - 0.015)) / SUN.r;
    const gap = k > 0 && fract((py - SUN.y) * 30 - t) < 0.1 + 0.55 * k;
    if (!gap) {
      const v = (py - SUN.y) / SUN.r;
      c = mix([330, 272, 82], [330, 120, 70], smooth(-1, 0.9, v));
      c = mix(
        c,
        [420, 400, 300],
        Math.exp(-((d / (SUN.r * 0.35)) ** 2)) * 0.6 * (v < 0.1 ? 1 : 0),
      );
    }
  }
  // Thin stratus bands, lit from below by the sun.
  for (const [y0, thickness, seed] of CLOUDS) {
    const band = Math.exp(-(((py - y0) / thickness) ** 2));
    if (band < 0.02) continue;
    const n = loopNoise(px * 3.2 + seed * 7, (py - y0) * 22, t, 0.25, 5);
    const density = smooth(0.48, 0.72, n) * band;
    if (density <= 0) continue;
    const lit =
      Math.exp(-Math.abs(px - SUN.x) / 0.5) * smooth(0.1, HORIZON, py);
    const under = mix([22, 32, 70], [255, 168, 120], lit);
    const edge = smooth(0.72, 0.5, n) * band;
    c = mix(c, add(under, [255, 222, 160], edge * lit * 0.6), density * 0.85);
  }
  return c;
}

function ridge(x, base, amp, seed) {
  return (
    base -
    amp *
      (0.6 * fbm(x * 2.2 + seed, seed, 5) +
        0.4 * Math.abs(Math.sin(x * 3.1 + seed)))
  );
}

/** HDR color of one sample (0–255 is the displayable range; lights go above). */
function sample(px, py, t) {
  if (py < HORIZON) {
    let c = sky(px, py, t);
    const side = smooth(0.1, 0.5, Math.abs(px - SUN.x));
    const far = ridge(px, HORIZON, 0.2 * side + 0.02, 3.7);
    const near = ridge(px, HORIZON, 0.12 * side + 0.01, 9.1);
    if (py > far) {
      c = mix([62, 78, 136], [30, 40, 86], (py - far) / 0.12);
      c = mix(
        c,
        [255, 170, 110],
        Math.exp(-(py - far) / 0.004) * 0.7 * (1 - side * 0.3),
      );
    }
    if (py > near) {
      c = mix([12, 20, 40], [5, 8, 16], (py - near) / 0.08);
      c = add(c, [255, 80, 170], Math.exp(-(py - near) / 0.003) * 0.9);
      c = add(
        c,
        [120, 225, 255],
        Math.exp(-((py - near - 0.006) ** 2) / 0.00001) * 0.25,
      );
    }
    return c;
  }
  // Glossy floor: the sky reflected with ripples, a neon grid on top.
  const z = 0.1 / (py - HORIZON + 0.0015);
  const ripple =
    0.006 * Math.sin(z * 30 - TAU * t) * smooth(0, 0.3, py - HORIZON);
  let reflection = sky(px + ripple, Math.max(0, HORIZON - (py - HORIZON)), t);
  reflection = add(
    reflection,
    [255, 200, 110],
    Math.exp(-(((px - SUN.x) / (0.07 + (py - HORIZON) * 0.4)) ** 2)) *
      Math.exp(-(py - HORIZON) * 5) *
      0.9,
  );
  // A teal tint on the reflection rounds out the hues, for the palettes.
  reflection = [reflection[0] * 0.75, reflection[1] * 1.1, reflection[2]];
  let c = mix(
    [4, 9, 18],
    mul(reflection, 0.55),
    0.35 + 0.4 * Math.exp(-(py - HORIZON) * 6),
  );
  const dx = Math.abs(fract(px * z * 7 + 0.5) - 0.5);
  const dz = Math.abs(fract(z * 3 + t + 0.5) - 0.5);
  const across = Math.exp(-((dx / (z * 7 * 0.0028 + 0.0015)) ** 2));
  const along = Math.exp(-((dz / (z * z * 0.08 + 0.003)) ** 2));
  const line = Math.max(across, along) * Math.exp(-z * 0.2);
  c = add(c, [110, 200, 255], line * 1.1);
  c = add(c, [207, 230, 255], line ** 4 * 0.8);
  c = add(c, [255, 190, 140], Math.exp(-(((py - HORIZON) / 0.01) ** 2)) * 0.9);
  return c;
}

// --- Rendering: antialiased HDR, bloom, tone curve --------------------------

const BLOOM = { threshold: 230, strength: 0.9, near: 0.018, far: 0.05 };
const WHITE = 2.2;

function gaussianBlur(buf, w, h, sigma) {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const kernel = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(v);
    sum += v;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
  const tmp = new Float32Array(buf.length);
  const out = new Float32Array(buf.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let s = 0;
        for (let i = -r; i <= r; i++) {
          const xx = Math.min(w - 1, Math.max(0, x + i));
          s += buf[(y * w + xx) * 3 + ch] * kernel[i + r];
        }
        tmp[(y * w + x) * 3 + ch] = s;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let s = 0;
        for (let i = -r; i <= r; i++) {
          const yy = Math.min(h - 1, Math.max(0, y + i));
          s += tmp[(yy * w + x) * 3 + ch] * kernel[i + r];
        }
        out[(y * w + x) * 3 + ch] = s;
      }
    }
  }
  return out;
}

/**
 * Bloom: the parts brighter than the threshold, blurred at two radii and
 * added back. Blurred on a copy scaled to about 360 px wide, so large
 * outputs don't need huge kernels and every size gets the same look.
 */
function addBloom(hdr, w, h) {
  const f = Math.max(1, Math.round(w / 360));
  const lw = Math.ceil(w / f);
  const lh = Math.ceil(h / f);
  const bright = new Float32Array(lw * lh * 3);
  const count = new Float32Array(lw * lh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 3;
      const l = 0.2126 * hdr[k] + 0.7152 * hdr[k + 1] + 0.0722 * hdr[k + 2];
      const share = Math.max(0, l - BLOOM.threshold) / Math.max(1, l);
      const q = Math.floor(y / f) * lw + Math.floor(x / f);
      bright[q * 3] += hdr[k] * share;
      bright[q * 3 + 1] += hdr[k + 1] * share;
      bright[q * 3 + 2] += hdr[k + 2] * share;
      count[q] += 1;
    }
  }
  for (let q = 0; q < lw * lh; q++)
    for (let ch = 0; ch < 3; ch++) bright[q * 3 + ch] /= count[q] || 1;
  const near = gaussianBlur(
    bright,
    lw,
    lh,
    Math.max(0.8, (BLOOM.near * w) / f),
  );
  const far = gaussianBlur(bright, lw, lh, Math.max(1.5, (BLOOM.far * w) / f));
  // Bilinear upsample of the blurred glow back onto the full image.
  for (let y = 0; y < h; y++) {
    const sy = Math.min(lh - 1, Math.max(0, (y + 0.5) / f - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(lh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(lw - 1, Math.max(0, (x + 0.5) / f - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(lw - 1, x0 + 1);
      const fx = sx - x0;
      for (let ch = 0; ch < 3; ch++) {
        const at = (xx, yy) =>
          near[(yy * lw + xx) * 3 + ch] * 0.6 +
          far[(yy * lw + xx) * 3 + ch] * 0.4;
        const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
        const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
        hdr[(y * w + x) * 3 + ch] +=
          (top * (1 - fy) + bottom * fy) * BLOOM.strength;
      }
    }
  }
}

function render(width, height, t, samples) {
  const aspect = width / height;
  const hdr = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = 0; j < samples; j++) {
        for (let i = 0; i < samples; i++) {
          const c = sample(
            ((x + (i + 0.5) / samples) / width) * aspect - aspect / 2,
            (y + (j + 0.5) / samples) / height,
            t,
          );
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const k = (y * width + x) * 3;
      const n = samples * samples;
      hdr[k] = r / n;
      hdr[k + 1] = g / n;
      hdr[k + 2] = b / n;
    }
  }
  addBloom(hdr, width, height);
  // Filmic curve (extended Reinhard): mid tones stay put, lights roll off to white.
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    for (let ch = 0; ch < 3; ch++) {
      const v = hdr[p * 3 + ch] / 255;
      data[p * 4 + ch] = Math.round(
        255 * Math.min(1, (v * (1 + v / (WHITE * WHITE))) / (1 + v * 0.35)),
      );
    }
    data[p * 4 + 3] = 255;
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
  return render(width, height, t, samples);
}

/** Every frame of one seamless loop. */
export function makeSampleAnimation(
  width,
  height,
  frames,
  { samples = 2 } = {},
) {
  return Array.from({ length: frames }, (_, f) =>
    render(width, height, f / frames, samples),
  );
}
