import { Filters } from "@/lib/types/filters";
import {
  Application,
  BlurFilter,
  ColorMatrixFilter,
  Filter,
  NoiseFilter,
  Sprite,
  Texture,
} from "pixi.js";
import { DEFAULT_FILTERS } from "./default-values";

export async function applyPixiFilters(
  canvas: HTMLCanvasElement,
  filters: Filters,
): Promise<HTMLCanvasElement> {
  const app = new Application();

  await app.init({
    width: canvas.width,
    height: canvas.height,
    backgroundAlpha: 0,
    antialias: true,
  });

  const texture = Texture.from(canvas);
  const sprite = new Sprite(texture);

  app.stage.addChild(sprite);

  const appliedFilters: Filter[] = [];

  if (filters.contrast !== DEFAULT_FILTERS.contrast) {
    const cm = new ColorMatrixFilter();
    cm.contrast(filters.contrast, false);
    appliedFilters.push(cm);
  }

  if (filters.brightness !== DEFAULT_FILTERS.brightness) {
    const cm = new ColorMatrixFilter();
    cm.brightness(filters.brightness, false);
    appliedFilters.push(cm);
  }

  if (filters.noise !== DEFAULT_FILTERS.noise) {
    const noise = new NoiseFilter({ noise: filters.noise });
    appliedFilters.push(noise);
  }

  if (filters.blur !== DEFAULT_FILTERS.blur) {
    const blur = new BlurFilter({ strength: filters.blur, quality: 4 });
    appliedFilters.push(blur);
  }

  sprite.filters = appliedFilters;

  app.renderer.render(app.stage);

  const pixiCanvas = app.renderer.extract.canvas(app.stage);

  const processedCanvas = document.createElement("canvas");
  processedCanvas.width = pixiCanvas.width;
  processedCanvas.height = pixiCanvas.height;

  const ctx = processedCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;

  // Convert pixiCanvas to HTMLCanvasElement
  const pixels = app.renderer.extract.pixels(sprite);
  const imageData = new ImageData(
    new Uint8ClampedArray(pixels.pixels),
    pixiCanvas.width,
    pixiCanvas.height,
  );
  ctx.putImageData(imageData, 0, 0);

  app.destroy(true, { children: true, texture: false });

  return processedCanvas;
}
