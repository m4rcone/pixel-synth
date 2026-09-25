import type { AlgorithmId } from "@/lib/algorithms";
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
 * Compatível com Ordered, Error Diffusion e Random.
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

export async function applyDither(
  canvas: HTMLCanvasElement,
  algorithm: AlgorithmId,
): Promise<HTMLCanvasElement> {
  let result: HTMLCanvasElement;

  switch (algorithm) {
    // 🔹 Error Diffusion Dithering
    case "floyd-steinberg":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.floydSteinberg,
        serpentine: true,
      });
      break;

    case "jarvis-judice-and-ninke-jjn":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.jarvisJudiceNinke,
        serpentine: true,
      });
      break;

    case "stucki":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.stucki,
        serpentine: true,
      });
      break;

    case "burkes":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.burkes,
        serpentine: true,
      });
      break;

    case "sierra":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierra,
        serpentine: true,
      });
      break;

    case "two-row-sierra":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierraTwoRow,
        serpentine: true,
      });
      break;

    case "sierra-lite":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.sierraLite,
        serpentine: true,
      });
      break;

    case "atkinson":
      result = await runDither(canvas, {
        errorPattern: ERROR_PATTERNS.atkinson,
      });
      break;

    // 🔹 Ordered Dithering
    case "bayer-2-2":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer2x2,
      });
      break;

    case "bayer-4-4":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer4x4,
      });
      break;

    case "bayer-8-8":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.bayer8x8,
      });
      break;

    case "clustered-dot-halftone-ordered":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.clustered4x4,
      });
      break;

    case "blue-noise":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.blueNoise8x8,
      });
      break;

    // 🔹 Random / Noise-Based
    case "random-dither":
      result = await runDither(canvas, {});
      break;

    case "void-and-cluster":
      result = await runDither(canvas, {
        matrix: DITHER_MATRICES.voidCluster8x8,
      });
      break;

    // 🔸 Fallback
    default:
      result = canvas;
      break;
  }

  return result;
}
