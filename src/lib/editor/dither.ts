import { DitherAlgorithm } from "@/lib/enum/dither-algorithm";
import { DITHER_MATRICES, ERROR_PATTERNS } from "@/lib/editor/dither-presets";

type ErrorPattern = { x: number; y: number; factor: number }[];

interface DitherOptions {
  matrix?: number[][];
  errorPattern?: ErrorPattern;
  colorMode?: "grayscale" | "rgb"; // novo
  serpentine?: boolean; // novo
  normalize?: number;
}

/**
 * Função base universal para aplicar dithering de forma assíncrona.
 * Compatível com Ordered, Error Diffusion, Random e Halftone.
 */
export async function runDither(
  sourceCanvas: HTMLCanvasElement,
  {
    matrix,
    errorPattern,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    colorMode = "grayscale",
    serpentine = false,
  }: DitherOptions,
): Promise<HTMLCanvasElement> {
  const ctx = sourceCanvas.getContext("2d")!;
  const { width, height } = sourceCanvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const CHUNK_SIZE = 32; // linhas processadas por iteração

  // 🔹 Função auxiliar: distribuir erro (difusão)
  const addError = (x: number, y: number, error: number[], factor: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    data[i] += error[0] * factor;
    data[i + 1] += error[1] * factor;
    data[i + 2] += error[2] * factor;
  };

  // 🔹 Loop principal
  for (let y = 0; y < height; y++) {
    const dir = serpentine && y % 2 === 1 ? -1 : 1;
    const startX = dir === 1 ? 0 : width - 1;
    const endX = dir === 1 ? width : -1;

    for (let x = startX; x !== endX; x += dir) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // --- Conversão para cinza (para algoritmos baseados em luminância)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (matrix) {
        // 🔸 Ordered Dithering
        const sizeY = matrix.length;
        const sizeX = matrix[0].length;
        const threshold =
          ((matrix[y % sizeY][x % sizeX] + 0.5) / (sizeX * sizeY)) * 255;

        const newVal = gray < threshold ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = newVal;
        continue;
      }

      if (errorPattern) {
        // 🔸 Error Diffusion Dithering
        const newVal = gray < 128 ? 0 : 255;
        const error = [r - newVal, g - newVal, b - newVal];

        data[i] = data[i + 1] = data[i + 2] = newVal;

        for (const { x: dx, y: dy, factor } of errorPattern) {
          addError(x + dx * dir, y + dy, error, factor);
        }
        continue;
      }

      // 🔸 Random Dither (fallback)
      const threshold = Math.random() * 255;
      const newVal = gray < threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = newVal;
    }

    // 🔹 Libera o event loop para não travar a UI
    if (y % CHUNK_SIZE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return sourceCanvas;
}

/* Halftone Dithering */
interface HalftoneCircularOptions {
  cellSize?: number; // tamanho da célula (px). Quanto maior, mais "grão" grande. padrão: 6
  angleDeg?: number; // ângulo da tela (em graus). clássico: 45°. padrão: 45
  minDot?: number; // raio mínimo do ponto (px). padrão: 0
  maxDot?: number; // raio máximo do ponto (px). padrão: cellSize * 0.5
  invert?: boolean; // inverte (fundo preto / pontos brancos). padrão: false
  background?: string; // cor de fundo. padrão: "#fff"
  foreground?: string; // cor dos pontos. padrão: "#000"
}

export async function runHalftoneCircularDither(
  sourceCanvas: HTMLCanvasElement,
  {
    cellSize = 6,
    angleDeg = 45,
    minDot = 0,
    maxDot, // default calculado abaixo
    invert = false,
    background = "#fff",
    foreground = "#000",
  }: HalftoneCircularOptions = {},
): Promise<HTMLCanvasElement> {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const srcCtx = sourceCanvas.getContext("2d")!;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;

  // fundo
  ctx.fillStyle = invert ? "#000" : background;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = invert ? "#fff" : foreground;

  const CHUNK_ROWS = 8; // processa 8 linhas de células por tick para não travar a UI
  const toRad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(toRad);
  const sinA = Math.sin(toRad);

  const maxR = maxDot ?? cellSize * 0.5;
  const minR = Math.max(0, Math.min(minDot, maxR));

  // utilitários
  const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v;

  const grayAt = (x: number, y: number) => {
    const xi = clamp(Math.floor(x), 0, w - 1);
    const yi = clamp(Math.floor(y), 0, h - 1);
    const i = (yi * w + xi) * 4;
    const r = srcData[i],
      g = srcData[i + 1],
      b = srcData[i + 2];
    return 0.299 * r + 0.587 * g + 0.114 * b; // 0..255
  };

  // cobrimos toda a tela mesmo após rotação: iteramos no "grid rotacionado"
  // e transformamos de volta para coordenadas da tela
  const pad = cellSize; // margem para garantir cobertura nas bordas
  const gridMinX = -pad;
  const gridMinY = -pad;
  const gridMaxX = Math.max(w, h) + pad;
  const gridMaxY = Math.max(w, h) + pad;

  let processedRowCount = 0;

  for (let gy = gridMinY; gy <= gridMaxY; gy += cellSize) {
    for (let gx = gridMinX; gx <= gridMaxX; gx += cellSize) {
      // (gx, gy) no grid → (cx, cy) na tela (rotação)
      const cx = gx * cosA - gy * sinA;
      const cy = gx * sinA + gy * cosA;

      if (
        cx < -cellSize ||
        cx > w + cellSize ||
        cy < -cellSize ||
        cy > h + cellSize
      ) {
        continue; // fora da tela
      }

      const g = grayAt(cx, cy) / 255; // 0..1
      const t = invert ? g : 1 - g; // intensidade do ponto
      const r = minR + t * (maxR - minR);
      if (r <= 0.001) continue;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    processedRowCount++;
    if (processedRowCount % CHUNK_ROWS === 0) {
      await new Promise((res) => setTimeout(res, 0));
    }
  }

  return out;
}

export async function applyDither(
  canvas: HTMLCanvasElement,
  algorithm: DitherAlgorithm,
): Promise<HTMLCanvasElement> {
  let result: HTMLCanvasElement;

  switch (algorithm) {
    // 🔹 Error Diffusion Dithering
    case DitherAlgorithm.FloydSteinberg:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.floydSteinberg,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.JarvisJudiceNinke:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.jarvisJudiceNinke,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.Stucki:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.stucki,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.Burkes:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.burkes,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.Sierra:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierra,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.TwoRowSierra:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierraTwoRow,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.SierraLite:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierraLite,
        serpentine: true,
      });
      break;

    case DitherAlgorithm.Atkinson:
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.atkinson,
      });
      break;

    // 🔹 Ordered Dithering
    case DitherAlgorithm.Bayer2x2:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer2x2,
      });
      break;

    case DitherAlgorithm.Bayer4x4:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer4x4,
      });
      break;

    case DitherAlgorithm.Bayer8x8:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer8x8,
      });
      break;

    case DitherAlgorithm.ClusteredDot:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.clustered4x4,
      });
      break;

    case DitherAlgorithm.BlueNoise:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.blueNoise8x8,
      });
      break;

    // 🔹 Random / Noise-Based
    case DitherAlgorithm.Random:
      result = await runDither(canvas, {});
      break;

    case DitherAlgorithm.VoidandCluster:
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.voidCluster8x8,
      });
      break;

    // 🔹 Halftone Dithering
    case DitherAlgorithm.HalftoneCircular:
      result = await runHalftoneCircularDither(canvas, {
        cellSize: 6,
        angleDeg: 0,
        minDot: 0,
        // maxDot: 3, // 0.5 * cellSize é um bom início (6 * 0.5 = 3)
        invert: false,
      });
      break;

    // 🔸 Fallback
    default:
      result = canvas;
      break;
  }

  return result;
}
