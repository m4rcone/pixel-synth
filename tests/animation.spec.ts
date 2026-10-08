import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { decodeGif } from "../src/lib/editor/gif/decode";
import { encodeGif } from "../src/lib/editor/gif/encode";
import { hexToRgb } from "../src/lib/editor/pixels";
import { ANIMATED_SAMPLE } from "../src/lib/samples";
import { getPalettePreset } from "../src/lib/palettes";

const FRAMES = ANIMATED_SAMPLE.frames;

/**
 * Opens the animated sample, paused (reduced motion) unless asked, and waits
 * for every frame to render (it renders on arrival).
 */
async function openSample(page: Page, query = "", { motion = false } = {}) {
  if (!motion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/editor?sample=animated${query}`);
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Animation ready.",
  );
  await expect(page.getByRole("progressbar")).toHaveCount(0);
}

const counter = (page: Page) => page.getByText(/^Frame \d+ of \d+$/);

test("an animated GIF loads with frame controls", async ({ page }) => {
  await openSample(page);
  await expect(counter(page)).toHaveText(`Frame 1 of ${FRAMES}`);

  const slider = page.getByRole("slider", { name: "Frame" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(counter(page)).toHaveText(`Frame 3 of ${FRAMES}`);
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    `Frame 3 of ${FRAMES}`,
  );

  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(counter(page)).not.toHaveText(`Frame 3 of ${FRAMES}`);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(
    page.getByRole("button", { name: "Play animation" }),
  ).toBeVisible();
});

test("playback starts paused under reduced motion", async ({ page }) => {
  await openSample(page);
  await expect(
    page.getByRole("button", { name: "Play animation" }),
  ).toBeVisible();
  await page.waitForTimeout(ANIMATED_SAMPLE.delay * 4);
  await expect(counter(page)).toHaveText(`Frame 1 of ${FRAMES}`);
});

test("playback starts right away otherwise", async ({ page }) => {
  await openSample(page, "", { motion: true });
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeVisible();
  await expect(counter(page)).not.toHaveText(`Frame 1 of ${FRAMES}`);
});

test("the canvas steps frames and plays from the keyboard", async ({
  page,
}) => {
  await openSample(page);
  const canvas = page.getByRole("application");
  await canvas.focus();
  await page.keyboard.press(".");
  await expect(counter(page)).toHaveText(`Frame 2 of ${FRAMES}`);
  await page.keyboard.press(",");
  await page.keyboard.press(",");
  await expect(counter(page)).toHaveText(`Frame ${FRAMES} of ${FRAMES}`);
  await page.keyboard.press("k");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeVisible();
  await expect(page.locator("#canvas-keyboard-instructions")).toContainText(
    "comma and period step one frame",
  );
});

test("an animated GIF can be dropped or picked like any image", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  const response = await page.request.get(ANIMATED_SAMPLE.src);
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "picked.gif",
    mimeType: "image/gif",
    buffer: await response.body(),
  });
  await expect(counter(page)).toHaveText(`Frame 1 of ${FRAMES}`);
});

test("every frame renders on arrival, then saves as an animated GIF", async ({
  page,
}) => {
  await openSample(page, "&palette=gameboy");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save animation" });
  await expect(
    dialog.getByRole("button", { name: "Animated GIF" }),
  ).toHaveAttribute("aria-pressed", "true");
  // 360 px wide: ×2 is the largest factor within ~800 px.
  await expect(dialog.getByRole("button", { name: /^2x,/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog).toContainText(`${FRAMES} frames at 720 × 480 px`);

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save GIF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(
    "pixelsynth-floyd-steinberg-gameboy-2x.gif",
  );

  const gif = decodeGif(new Uint8Array(readFileSync((await file.path())!)));
  expect(gif.frames).toHaveLength(FRAMES);
  expect(gif.width).toBe(ANIMATED_SAMPLE.width * 2);
  expect(gif.height).toBe(ANIMATED_SAMPLE.height * 2);
  expect(gif.loop).toBe(0);
  expect(gif.frames.every((f) => f.delay === ANIMATED_SAMPLE.delay)).toBe(true);
  const allowed = new Set(
    getPalettePreset("gameboy")!.colors.map((hex) => hexToRgb(hex).join(",")),
  );
  let offPalette = 0;
  for (const { data } of gif.frames) {
    for (let i = 0; i < data.length; i += 4) {
      if (!allowed.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)) {
        offPalette++;
      }
    }
  }
  expect(offPalette).toBe(0);

  // The shown frame still saves as a PNG.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await dialog.getByRole("button", { name: "PNG (this frame)" }).click();
  const png = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG" }).click();
  expect((await png).suggestedFilename()).toMatch(/\.png$/);
});

test("error diffusion on an animation suggests stable algorithms", async ({
  page,
}) => {
  await openSample(page, "&algorithm=floyd-steinberg");
  await expect(
    page.getByRole("combobox", { name: "Algorithm" }),
  ).toHaveAccessibleDescription(/shimmer between frames/);
  await page.goto("/editor?sample=animated&algorithm=bayer-8-8");
  await expect(page.getByText(/shimmer between frames/)).toHaveCount(0);
});

test("a GIF past the frame limit says so", async ({ page }) => {
  const frames = Array.from({ length: 301 }, (_, f) => ({
    indices: Uint8Array.of(f % 2, 1, 0, 1),
    delay: 100,
  }));
  const bytes = encodeGif({
    width: 2,
    height: 2,
    palette: Uint8Array.of(0, 0, 0, 255, 255, 255),
    frames,
    loop: 0,
  });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "long.gif",
    mimeType: "image/gif",
    buffer: Buffer.from(bytes),
  });
  await expect(
    page
      .getByRole("region", { name: "Image editor workspace" })
      .getByRole("alert"),
  ).toContainText("“long.gif” has more than 300 frames");
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
]) {
  test(`an animation and its GIF save dialog have no axe violations (${viewport.name})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openSample(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Animated GIF" }),
    ).toHaveAttribute("aria-pressed", "true");
    // Reduced motion (openSample): the dialog opens at rest.
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("the animated sample takes a pending pixel art preset", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/editor?preset=pixel-art");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Try an animated sample" }).click();

  // 360×240 → 136×91, every frame rendered with the preset.
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Animation ready.",
  );
  await expect(page.getByLabel("Output size")).toHaveValue("136");
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 2×2",
  );
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "PICO-8",
  );
  await expect(counter(page)).toHaveText(`Frame 1 of ${FRAMES}`);
});

test("an animated GIF stays animated when the render worker won't load", async ({
  page,
}) => {
  await page.route(/worker/i, (route) => route.abort());
  await openSample(page);
  await expect(counter(page)).toHaveText(`Frame 1 of ${FRAMES}`);
});
