import { hexToRgb } from "@/lib/utils";
import { applyDither } from "./dither";
import { applyToneMapping } from "./tone-mapping";
import { generateLuminanceMap } from "./luminance";
import { downscaleImage, upscaleImage } from "./resize";
import { hasActiveFilters, type EditorSettings } from "./settings";

export async function renderPipeline(
  baseImage: HTMLImageElement,
  settings: EditorSettings,
  { dither: hasDither }: { dither: boolean },
): Promise<HTMLImageElement> {
  const {
    scale: ditherScale,
    algorithm,
    filters,
    colorCount,
    tones,
  } = settings;
  let processedCanvas: HTMLCanvasElement;

  if (hasDither && ditherScale !== 1) {
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

  if (hasActiveFilters(filters)) {
    const { applyPixiFilters } = await import("./filters");
    processedCanvas = await applyPixiFilters(processedCanvas, filters);
  }

  const luminanceMap = generateLuminanceMap(processedCanvas);

  if (hasDither) {
    processedCanvas = await applyDither(processedCanvas, algorithm);
  }

  if (hasDither) {
    const colorsRgb = {
      shadows: hexToRgb(tones.shadows.color),
      midtones: hexToRgb(tones.midtones.color),
      highlights: hexToRgb(tones.highlights.color),
    };

    const thresholds = {
      midtones: tones.midtones.range,
      shadows: tones.shadows.range,
    };

    await applyToneMapping(
      processedCanvas,
      colorsRgb,
      luminanceMap,
      thresholds,
      colorCount,
      settings.preserveLuminance,
    );
  }

  if (hasDither && ditherScale !== 1) {
    processedCanvas = upscaleImage(
      processedCanvas,
      baseImage.width,
      baseImage.height,
    );
  }

  const dataUrl = processedCanvas.toDataURL("image/png");
  const result = new Image();
  result.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    result.onload = () => resolve(result);
    result.onerror = () => reject(new Error("Could not decode rendered image"));
    result.src = dataUrl;
  });
}
