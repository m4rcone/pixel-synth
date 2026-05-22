import { Filters } from "@/lib/types/filters";
import { DitherAlgorithm } from "@/lib/enum/dither-algorithm";
import { hexToRgb } from "@/lib/utils";
import { applyDither } from "./dither";
import { applyToneMapping } from "./tone-mapping";
import { generateLuminanceMap } from "./luminance";
import { downscaleImage, upscaleImage } from "./resize";
import { DEFAULT_DITHER_SCALE, DEFAULT_FILTERS } from "./default-values";

interface RenderOptions {
  baseImage: HTMLImageElement;
  hasDither: boolean;
  ditherScale: number;
  ditherAlgorithm: DitherAlgorithm;
  filters: Filters;
  colorCount: number;
  luminance: boolean;
  colors: {
    shadows: { hex: string; range: number };
    midtones: { hex: string; range: number };
    highlights: { hex: string; range: number };
  };
}

export async function renderPipeline({
  baseImage,
  hasDither,
  ditherScale,
  ditherAlgorithm,
  filters,
  colorCount,
  luminance,
  colors,
}: RenderOptions): Promise<HTMLImageElement> {
  try {
    let processedCanvas: HTMLCanvasElement;

    if (hasDither && ditherScale !== DEFAULT_DITHER_SCALE) {
      processedCanvas = downscaleImage(baseImage, ditherScale);
    } else {
      processedCanvas = document.createElement("canvas");
      processedCanvas.width = baseImage.width;
      processedCanvas.height = baseImage.height;

      const ctx = processedCanvas.getContext("2d", {
        willReadFrequently: true,
      })!;

      ctx.drawImage(baseImage, 0, 0);
    }

    const hasNewFilters =
      filters.contrast !== DEFAULT_FILTERS.contrast ||
      filters.brightness !== DEFAULT_FILTERS.brightness ||
      filters.noise > DEFAULT_FILTERS.noise ||
      filters.blur > DEFAULT_FILTERS.blur;

    if (hasNewFilters) {
      const { applyPixiFilters } = await import("./filters");
      processedCanvas = await applyPixiFilters(processedCanvas, filters);
    }

    const luminanceMap = generateLuminanceMap(processedCanvas);

    if (hasDither) {
      processedCanvas = await applyDither(processedCanvas, ditherAlgorithm);
    }

    if (hasDither) {
      const colorsRgb = {
        shadows: hexToRgb(colors.shadows.hex),
        midtones: hexToRgb(colors.midtones.hex),
        highlights: hexToRgb(colors.highlights.hex),
      };

      const thresholds = {
        midtones: colors.midtones.range,
        shadows: colors.shadows.range,
      };

      await applyToneMapping(
        processedCanvas,
        colorsRgb,
        luminanceMap,
        thresholds,
        colorCount,
        luminance,
      );
    }

    if (hasDither && ditherScale !== DEFAULT_DITHER_SCALE) {
      processedCanvas = upscaleImage(
        processedCanvas,
        baseImage.width,
        baseImage.height,
      );
    }

    const dataUrl = processedCanvas.toDataURL("image/png");
    const result = new Image();
    result.crossOrigin = "anonymous";

    return new Promise((resolve) => {
      result.onload = () => {
        resolve(result);
      };
      result.src = dataUrl;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
}
