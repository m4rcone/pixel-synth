import { DEFAULT_TONE_RANGE } from "./default-values";

type ToneMappingColors = {
  highlights: { r: number; g: number; b: number };
  midtones: { r: number; g: number; b: number };
  shadows: { r: number; g: number; b: number };
};

type ToneMappingThresholds = {
  midtones: number;
  shadows: number;
};

export async function applyToneMapping(
  canvas: HTMLCanvasElement,
  colors: ToneMappingColors,
  luminanceMap: Uint8Array,
  thresholds: ToneMappingThresholds,
  colorCount: number,
  luminance: boolean,
): Promise<void> {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const midtoneMax = thresholds.midtones ?? DEFAULT_TONE_RANGE.midtones;
  const shadowMax = thresholds.shadows ?? DEFAULT_TONE_RANGE.shadows;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];

    if (r > 200 && g > 200 && b > 200) {
      const lum = luminanceMap[i / 4];
      let color;

      if (colorCount === 1) {
        // Only highlights
        if (colors.highlights) {
          color = colors.highlights;
        }
      } else if (colorCount === 2) {
        // Highlights and midtones
        if (lum <= midtoneMax && colors.midtones) {
          color = colors.midtones;
        } else if (colors.highlights) {
          color = colors.highlights;
        }
      } else {
        // Highlights, midtones and shadows
        if (lum <= shadowMax && colors.shadows) {
          color = colors.shadows;
        } else if (lum <= midtoneMax && colors.midtones) {
          color = colors.midtones;
        } else if (colors.highlights) {
          color = colors.highlights;
        } else {
          continue;
        }
      }

      if (luminance) {
        if (color) {
          // Normaliza a luminância para 0-1
          const lumNormalized = lum / 255;

          // Aplica a cor preservando a luminância relativa do pixel
          // Isso mantém os detalhes e profundidade da imagem
          data[i] = color.r * lumNormalized;
          data[i + 1] = color.g * lumNormalized;
          data[i + 2] = color.b * lumNormalized;
        }
      } else {
        if (color) {
          data[i] = color.r;
          data[i + 1] = color.g;
          data[i + 2] = color.b;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
