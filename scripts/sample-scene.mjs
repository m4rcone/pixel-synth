// Procedural sample image: a sunset landscape (smooth gradients, saturated
// colors, a shaded sphere, fine ripples and grass) above a calibration strip
// (grayscale ramp + hue spectrum fading to white). Deterministic, so the
// sample and every preview derived from it can be regenerated exactly.

const clamp = (v) => Math.min(255, Math.max(0, v));
const mix = (a, b, t) => {
  const k = Math.min(1, Math.max(0, t));
  return a.map((v, i) => v + (b[i] - v) * k);
};
const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const ridge = (u, base, amp, f, phase) =>
  base -
  amp *
    (0.5 * Math.sin(u * f + phase) +
      0.3 * Math.sin(u * f * 2.3 + phase * 1.7) +
      0.2 * Math.sin(u * f * 5.1 + phase * 0.3));
const hsv = (h, s, v) => {
  const f = (n) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
};

const HORIZON = 0.66;
const SUN = { u: 0.68, v: 0.5, r: 0.075 };

/**
 * @param {number} width
 * @param {number} height
 * @param {{ strip?: boolean }} [options] add the calibration strip (10% of the height)
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }} RGBA pixels
 */
export function makeSampleScene(width, height, { strip = true } = {}) {
  const stripHeight = strip ? Math.round(height * 0.1) : 0;
  const sceneHeight = height - stripHeight;
  const aspect = width / sceneHeight;
  const data = new Uint8ClampedArray(width * height * 4);
  const put = (x, y, [r, g, b]) => {
    const i = (y * width + x) * 4;
    data[i] = Math.round(clamp(r));
    data[i + 1] = Math.round(clamp(g));
    data[i + 2] = Math.round(clamp(b));
    data[i + 3] = 255;
  };

  const sky = (u, v) => {
    let c = mix([18, 24, 72], [60, 70, 150], v / 0.3);
    c = mix(c, [235, 120, 110], smoothstep(0.25, 0.55, v));
    c = mix(c, [255, 190, 110], smoothstep(0.5, HORIZON, v));
    const d = Math.hypot((u - SUN.u) * aspect, v - SUN.v);
    c = mix(c, [255, 215, 150], Math.exp(-((d / 0.22) ** 2)) * 0.7);
    if (d < SUN.r) c = mix([255, 250, 215], [255, 200, 90], d / SUN.r);
    return c;
  };

  for (let y = 0; y < sceneHeight; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / sceneHeight;
      let c = sky(u, v);

      const far = ridge(u, 0.55, 0.1, 6, 0.8);
      const near = ridge(u, 0.63, 0.07, 9, 3.1);
      if (v > far) c = mix([120, 90, 150], [70, 55, 110], (v - far) / 0.15);
      if (v > near) c = mix([60, 70, 105], [35, 40, 70], (v - near) / 0.08);

      if (v > HORIZON) {
        // Lake: the sky mirrored, darker, with ripples.
        const mirrored = HORIZON - (v - HORIZON) * 1.4;
        const ripple = Math.sin(v * 900 + Math.sin(u * 40) * 2) * 0.004;
        c = mix(
          sky(u + ripple, Math.max(0, mirrored)),
          [20, 30, 60],
          0.35 + (v - HORIZON) * 1.2,
        );
      }
      if (v > 0.82) {
        // Shore meadow with fine grass stripes.
        const grass = 0.08 * Math.sin(u * 700 + Math.sin(v * 90) * 3);
        c = mix([110, 160, 70], [40, 90, 45], (v - 0.82) / 0.18 + grass);
      }

      // Shaded red sphere on the shore.
      const bx = (u - 0.26) * aspect;
      const by = v - 0.8;
      const radius = 0.13;
      const dist = Math.hypot(bx, by);
      if (dist < radius) {
        const nz = Math.sqrt(1 - (dist / radius) ** 2);
        const nx = bx / radius;
        const ny = by / radius;
        const diffuse = Math.max(0, -0.45 * nx - 0.55 * ny + 0.7 * nz);
        c = mix([55, 8, 18], [235, 60, 55], diffuse);
        c = mix(
          c,
          [255, 245, 235],
          Math.max(0, -0.3 * nx - 0.4 * ny + 0.87 * nz) ** 40,
        );
        c = mix(c, [255, 170, 100], Math.max(0, nx) * 0.25 * nz);
      }
      // Soft contact shadow.
      const shadow = Math.hypot(bx * 0.6, (v - 0.925) * 3);
      if (dist >= radius && v > 0.87 && shadow < 0.12) {
        c = mix(c, [15, 30, 20], (1 - shadow / 0.12) * 0.55);
      }

      put(x, y, c);
    }
  }

  // Calibration strip: grayscale ramp | hue spectrum fading to white on top.
  for (let y = sceneHeight; y < height; y++) {
    const t = (y - sceneHeight) / stripHeight;
    for (let x = 0; x < width; x++) {
      const half = width / 2;
      put(
        x,
        y,
        x < half
          ? Array(3).fill((x / (half - 1)) * 255)
          : mix(hsv((x - half) / half, 1, 1), [255, 255, 255], 1 - t * 1.6),
      );
    }
  }

  return { data, width, height };
}
