"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Domain-warped Perlin fbm, quantized with an 8×8 Bayer matrix: the same
// look as a dithered render, computed in one pass at low resolution.
const FRAGMENT = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform vec3 color;
uniform float levels;
uniform float frequency;
uniform float amplitude;

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz, iy = Pi.yyww, fx = Pf.xzxz, fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  gx = gx - floor(gx + 0.5);
  vec2 g00 = vec2(gx.x, gy.x), g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z), g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x)), n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z)), n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 f = fade(Pf.xy);
  vec2 nx = mix(vec2(n00, n01), vec2(n10, n11), f.x);
  return 2.3 * mix(nx.x, nx.y, f.y);
}

float fbm(vec2 p) {
  float value = 0.0, amp = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amp * abs(cnoise(p));
    p *= frequency;
    amp *= amplitude;
  }
  return value;
}

float bayer8(vec2 p) {
  // Recursive 2×2 Bayer, 3 levels deep → 8×8 thresholds in [0, 1).
  // Coarse levels first: the finest level carries the most weight.
  float t = 0.0, s = 4.0;
  for (int i = 0; i < 3; i++) {
    vec2 q = mod(floor(p / s), 2.0);
    t = t * 0.25 + (q.x * 2.0 + q.y * 3.0 - 4.0 * q.x * q.y) * 0.25;
    s *= 0.5;
  }
  return t;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution - 0.5;
  uv.x *= resolution.x / resolution.y;
  float f = fbm(uv + fbm(uv - time));
  vec3 c = color * f;

  float step = 1.0 / (levels - 1.0);
  c += (bayer8(gl_FragCoord.xy) - 0.25) * step;
  c = clamp(c - 0.2, 0.0, 1.0);
  c = floor(c * (levels - 1.0) + 0.5) / (levels - 1.0);
  gl_FragColor = vec4(c, 1.0);
}
`;

type DitherBackgroundProps = {
  className?: string;
  /** RGB, 0–1. */
  color?: [number, number, number];
  levels?: number;
  speed?: number;
  frequency?: number;
  amplitude?: number;
  /** Size of one dither cell in CSS pixels. */
  pixelSize?: number;
};

const FRAME_INTERVAL = 1000 / 30;
const DEFAULT_COLOR: [number, number, number] = [0.46, 0.46, 0.5];

/**
 * Animated dithered-noise backdrop. Decorative: hidden from assistive tech,
 * paused offscreen or in background tabs, static under reduced motion, and
 * silently absent when WebGL is unavailable.
 */
export function DitherBackground({
  className,
  color = DEFAULT_COLOR,
  levels = 4,
  speed = 0.04,
  frequency = 3,
  amplitude = 0.28,
  pixelSize = 2,
}: DitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!canvas || !gl) return;

    const program = createProgram(gl, VERTEX, FRAGMENT);
    if (!program) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uResolution = uniform("resolution");
    const uTime = uniform("time");
    gl.uniform3fv(uniform("color"), color);
    gl.uniform1f(uniform("levels"), levels);
    gl.uniform1f(uniform("frequency"), frequency);
    gl.uniform1f(uniform("amplitude"), amplitude);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let last = 0;
    const start = performance.now();

    const draw = (now: number) => {
      gl.uniform1f(uTime, ((now - start) / 1000) * speed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      // Render one texel per dither cell; CSS upscales it pixelated.
      const width = Math.max(1, Math.round(canvas.clientWidth / pixelSize));
      const height = Math.max(1, Math.round(canvas.clientHeight / pixelSize));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      draw(performance.now());
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < FRAME_INTERVAL) return;
      last = now;
      draw(now);
    };

    const update = () => {
      cancelAnimationFrame(frame);
      if (visible && !document.hidden && !reducedMotion.matches) {
        frame = requestAnimationFrame(loop);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    // Colors are compared by value so inline arrays don't restart WebGL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color.join(), levels, speed, frequency, amplitude, pixelSize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block size-full [image-rendering:pixelated]", className)}
    />
  );
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}
