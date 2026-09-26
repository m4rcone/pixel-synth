import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

// 4×4 RGB gradient
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAANklEQVR4nGNgYGCwsbGpqKjYsmULg4iISEBAQE9Pz4kTJxg0NDRSUlIWLFhw584dhJoPHz4AAOIjFoHzOnRsAAAAAElFTkSuQmCC";

async function upload(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "gradient.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_BASE64, "base64"),
  });
}

test("renders a dithered image and offers a download", async ({ page }) => {
  await page.goto("/editor");
  await upload(page);
  await page.getByRole("button", { name: "Apply dither" }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Rendered image is ready",
  );

  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog", { name: "Save image" });
  // A tiny 4×4 result defaults to the largest factor.
  await expect(dialog.getByRole("button", { name: /^8x,/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG" }).click();
  expect((await download).suggestedFilename()).toBe(
    "pixelsynth-floyd-steinberg-8x.png",
  );
});

test("?algorithm= preselects the algorithm from the catalog", async ({
  page,
}) => {
  await page.goto("/editor?algorithm=bayer-8-8");
  await upload(page);
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 8×8",
  );
});

test("catalog links open the editor with that algorithm", async ({ page }) => {
  await page.goto("/algorithms/atkinson");
  await page.getByRole("link", { name: "Use Atkinson in the editor" }).click();
  await expect(page).toHaveURL(/\/editor\?algorithm=atkinson$/);
  await upload(page);
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Atkinson",
  );
});

test("an image can be pasted from the clipboard", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], "pasted.png", { type: "image/png" }));
    window.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, cancelable: true }),
    );
  }, PNG_BASE64);

  await expect(
    page.getByRole("application", { name: "Original image canvas" }),
  ).toBeVisible();
});

test("split view compares original and processed", async ({ page }) => {
  await page.goto("/editor");
  await upload(page);
  await page.getByRole("button", { name: "Apply dither" }).click();

  const split = page.getByRole("button", { name: "Split before and after" });
  await split.click();
  await expect(split).toHaveAttribute("aria-pressed", "true");

  const canvas = page.getByRole("application", {
    name: /split comparison canvas/i,
  });
  await canvas.focus();
  await page.keyboard.press("]");
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Divider at 55%.",
  );
});

test("unsupported files show an actionable error", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "is not an image" }),
  ).toBeVisible();
});

test("SVG files are rejected with a specific message", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "SVG files aren’t supported" }),
  ).toBeVisible();
});

test("catalog cards open the algorithm page from anywhere on the card", async ({
  page,
}) => {
  await page.goto("/algorithms");
  await page.waitForLoadState("networkidle");
  // Click where the card's description is, not its title.
  const description = page.getByText("An optimized version of JJN");
  await description.scrollIntoViewIfNeeded();
  const box = await description.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page).toHaveURL(/\/algorithms\/stucki$/);
});

const SPHERE = "public/250/sphere-250.png";

test("palette mode dithers to a preset and names the export", async ({
  page,
}) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles(SPHERE);
  await page.getByRole("button", { name: "Apply dither" }).click();

  await page.getByRole("button", { name: "Palette", exact: true }).click();
  await page.getByRole("combobox", { name: "Palette" }).click();
  await page.getByRole("option", { name: "Game Boy", exact: true }).click();
  // Game Boy defaults to matching by brightness.
  await expect(
    page.getByRole("button", { name: "Brightness", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("4 colors")).toBeVisible();

  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog", { name: "Save image" });
  await dialog.getByRole("button", { name: /^1x,/ }).click();
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG" }).click();
  expect((await download).suggestedFilename()).toBe(
    "pixelsynth-floyd-steinberg-gameboy.png",
  );
});

test("pixel art preset targets ~12k pixels with PICO-8 and Bayer 2×2", async ({
  page,
}) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  // 250×250 sphere → 111×111 (≈ 128×96 worth of pixels).
  await page.getByLabel(/drop an image/i).setInputFiles(SPHERE);
  await page.getByRole("button", { name: "Pixel art preset" }).click();

  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Output size")).toHaveValue("111");
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 2×2",
  );
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "PICO-8",
  );
});

test("output width field sets the processing scale", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles(SPHERE);

  const width = page.getByLabel("Output size");
  await width.fill("100");
  await width.press("Enter");
  await expect(
    page.getByRole("slider", { name: "Processing scale" }),
  ).toHaveAttribute("aria-valuetext", "40%");
});

test("custom palette colors can be added and removed", async ({ page }) => {
  await page.goto("/editor");
  await upload(page);
  await page.getByRole("button", { name: "Palette", exact: true }).click();
  await page.getByRole("button", { name: "Edit colors" }).click();

  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(16);
  await page.getByRole("button", { name: "Remove color 16" }).click();
  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(15);
  await page.getByRole("button", { name: "Add color" }).click();
  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(16);
});

test("'None' is offered as a no-dithering choice", async ({ page }) => {
  await page.goto("/editor");
  await upload(page);
  await page.getByRole("combobox", { name: "Algorithm" }).click();
  await page.getByRole("option", { name: "None (nearest color)" }).click();
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "None (nearest color)",
  );
});

test("the empty editor loads the sample image", async ({ page }) => {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Try a sample image" }).click();

  await expect(
    page.getByRole("application", { name: "Original image canvas" }),
  ).toBeVisible();
  await expect(page.getByLabel("Output size")).toHaveValue("1800");
});

test("?palette= switches to palette mode with that palette", async ({
  page,
}) => {
  await page.goto("/editor?palette=gameboy&algorithm=bayer-4-4");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Try a sample image" }).click();

  await expect(
    page.getByRole("button", { name: "Palette", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "Game Boy",
  );
  await expect(
    page.getByRole("button", { name: "Brightness", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 4×4",
  );
});

test("palette cards open the editor with that palette", async ({ page }) => {
  await page.goto("/palettes");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("link", { name: /Use in the editor\s*:\s*Cyanotype/ })
    .click();
  await expect(page).toHaveURL(/\/editor\?palette=cyanotype$/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Try a sample image" }).click();
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "Cyanotype",
  );
});

test("the palettes page link applies the full pixel art preset", async ({
  page,
}) => {
  await page.goto("/palettes");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Try the pixel art preset" }).click();
  await expect(page).toHaveURL(/\/editor\?preset=pixel-art$/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Try a sample image" }).click();

  // Sample 1800×1200 → 136×91, dithered right away.
  await expect(page.getByLabel("Output size")).toHaveValue("136");
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 2×2",
  );
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "PICO-8",
  );
});

test("1-bit mode names its dot colors", async ({ page }) => {
  await page.goto("/editor");
  await upload(page);
  await page.getByRole("button", { name: "Apply dither" }).click();

  await expect(
    page.getByRole("button", { name: "1-bit", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const dotColors = page.getByRole("combobox", { name: "Dot colors" });
  await expect(dotColors).toBeEnabled();
  await dotColors.click();
  await page.getByRole("option", { name: "3 colors" }).click();
  await expect(dotColors).toHaveText("3 colors");
  await expect(
    page.getByRole("checkbox", { name: "Shade by brightness" }),
  ).toHaveCount(0);
});

test("?sample=1 opens the editor on the sample image", async ({ page }) => {
  await page.goto("/editor?sample=1");

  await expect(
    page.getByRole("application", { name: "Original image canvas" }),
  ).toBeVisible();
  await expect(page.getByLabel("Output size")).toHaveValue("1800");
});

test("?sample=1&preset=pixel-art opens on the pixelated sample", async ({
  page,
}) => {
  await page.goto("/editor?sample=1&preset=pixel-art");

  // Sample 1800×1200 → 136×91, dithered right away.
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Output size")).toHaveValue("136");
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "PICO-8",
  );
});

test("'Report a bug' carries the settings, never the image", async ({
  page,
}) => {
  await page.goto("/editor?algorithm=atkinson");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles(SPHERE);
  await page.getByRole("button", { name: "Apply dither" }).click();
  await page.getByRole("button", { name: "Editor help" }).click();

  const href = await page
    .getByRole("link", { name: /Report a bug/ })
    .getAttribute("href");
  const url = new URL(href!);
  expect(url.pathname).toBe("/m4rcone/pixel-synth/issues/new");
  expect(url.searchParams.get("template")).toBe("bug.yml");
  const context = url.searchParams.get("context")!;
  expect(context).toContain("Algorithm: atkinson");
  expect(context).toContain("Image: 250 × 250 px");
  expect(href).not.toContain("sphere");
  await expect(
    page.getByRole("link", { name: /Suggest a feature/ }),
  ).toHaveAttribute("href", /\/discussions\/new\?category=ideas$/);
});

test("a settings link reopens the editor with the same look", async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await page.goto("/editor?sample=1&algorithm=atkinson&palette=gameboy");
  await page.getByRole("button", { name: "Apply dither" }).click();
  const contrast = page.getByRole("slider", { name: "Contrast" });
  await contrast.focus();
  await page.keyboard.press("ArrowRight");
  await expect(contrast).toHaveAttribute("aria-valuetext", "0.01");

  await page.getByRole("button", { name: "Share settings" }).click();
  const link = await page.getByLabel("Settings link").inputValue();
  expect(new URL(link).pathname).toBe("/editor");
  expect(link).not.toContain("sunset");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied to the clipboard.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

  const other = await context.newPage();
  const { pathname, search } = new URL(link);
  await other.goto(pathname + search);
  await other.waitForLoadState("networkidle");
  await other.getByRole("button", { name: "Try a sample image" }).click();

  // Dithered right away, with every shared setting.
  await expect(
    other.getByRole("button", { name: "Reset", exact: true }),
  ).toBeVisible();
  await expect(other.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Atkinson",
  );
  await expect(other.getByRole("combobox", { name: "Palette" })).toContainText(
    "Game Boy",
  );
  await expect(other.getByRole("slider", { name: "Contrast" })).toHaveAttribute(
    "aria-valuetext",
    "0.01",
  );
});

test("an unreadable settings link says so", async ({ page }) => {
  await page.goto("/editor?s=not-a-code");
  await expect(
    page.getByRole("alert").filter({ hasText: "settings link can’t be read" }),
  ).toBeVisible();
});

test("a settings link's custom palette wins over the saved one", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "pixelsynth:custom-palette",
      JSON.stringify(["#111111", "#222222", "#333333", "#444444", "#555555"]),
    );
  });
  const code = Buffer.from(
    JSON.stringify({
      v: 1,
      color: { mode: "palette", palette: "custom" },
      custom: ["#000000", "#ff0000", "#ffffff"],
    }),
  ).toString("base64url");
  await page.goto(`/editor?sample=1&s=${code}`);
  // The custom palette's color editor is open by default.
  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(3);
  await expect(page.getByLabel("Color 2", { exact: true })).toHaveValue(
    "#ff0000",
  );
});

test("error diffusion strength shows only for diffusion algorithms", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();

  const diffusion = page.getByRole("slider", { name: "Error diffusion" });
  await expect(diffusion).toHaveAttribute("aria-valuetext", "100%");
  await diffusion.focus();
  await page.keyboard.press("Home");
  await expect(diffusion).toHaveAttribute("aria-valuetext", "0%");

  await page.getByRole("combobox", { name: "Algorithm" }).click();
  await page.getByRole("option", { name: "Bayer 4×4" }).click();
  await expect(diffusion).toHaveCount(0);

  const saturation = page.getByRole("slider", { name: "Saturation" });
  await saturation.focus();
  await page.keyboard.press("Home");
  await expect(saturation).toHaveAttribute("aria-valuetext", "-1.00");
});

test("halftone screens show their size, angle and shape", async ({ page }) => {
  await page.goto("/editor?sample=1&algorithm=halftone");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Rendered image is ready",
  );
  await expect(
    page.getByRole("slider", { name: "Error diffusion" }),
  ).toHaveCount(0);

  const size = page.getByRole("slider", { name: "Screen size" });
  const angle = page.getByRole("slider", { name: "Screen angle" });
  await expect(size).toHaveAttribute("aria-valuetext", "8 px");
  await expect(angle).toHaveAttribute("aria-valuetext", "45°");

  const before = await canvasPrint(page);
  await angle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(angle).toHaveAttribute("aria-valuetext", "52.5°");
  await expect
    .poll(() => canvasPrint(page), { message: "angle changes the image" })
    .not.toBe(before);

  const shape = page.getByRole("group", { name: "Dot shape" });
  await shape.getByRole("button", { name: "Diamond" }).click();
  await expect(shape.getByRole("button", { name: "Diamond" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Line Screen shares size and angle, but has no dot shape.
  await page.getByRole("combobox", { name: "Algorithm" }).click();
  await page.getByRole("option", { name: "Line Screen" }).click();
  await expect(angle).toHaveAttribute("aria-valuetext", "52.5°");
  await expect(shape).toHaveCount(0);

  // Lines bend: displacement and wave, with a wave length once waving.
  const displace = page.getByRole("slider", { name: "Displacement" });
  await expect(displace).toHaveAttribute("aria-valuetext", "0 lines");
  const straight = await canvasPrint(page);
  await displace.focus();
  await page.keyboard.press("PageUp");
  await expect
    .poll(() => canvasPrint(page), { message: "displacement bends the lines" })
    .not.toBe(straight);
  const wavelength = page.getByRole("slider", { name: "Wave length" });
  await expect(wavelength).toHaveCount(0);
  await page.getByRole("slider", { name: "Wave", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(wavelength).toHaveAttribute("aria-valuetext", "12 lines");

  await page.getByRole("combobox", { name: "Algorithm" }).click();
  await page.getByRole("option", { name: "Bayer 4×4" }).click();
  await expect(size).toHaveCount(0);
});

test("editing the NES palette keeps all 54 colors", async ({ page }) => {
  await page.goto("/editor?sample=1&palette=nes");
  await page.getByRole("button", { name: "Edit colors" }).click();
  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(54);
});

test("the save dialog blocks sizes browsers can't draw", async ({ page }) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog", { name: "Save image" });

  // 1800 × 1200 at ×8 is 14400 × 9600, past Firefox's canvas area limit.
  await expect(dialog.getByRole("button", { name: /^8x,/ })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: /^4x,/ })).toBeEnabled();
  await expect(dialog).toContainText("×8 is too large for browsers to draw.");
});

test("a failed export says so and keeps the dialog open", async ({ page }) => {
  // What browsers do past their canvas limits: no blob, no error. The
  // indexed PNG path is blocked too, so both ways of saving fail.
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
    window.CompressionStream = undefined as never;
  });
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog", { name: "Save image" });
  await dialog.getByRole("button", { name: "Save PNG" }).click();

  await expect(dialog.getByRole("alert")).toContainText(
    "Your browser couldn’t create a 1800 × 1200 image.",
  );
  await expect(dialog).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("exports are indexed PNGs at the smallest bit depth", async ({ page }) => {
  await page.goto("/editor?sample=1&palette=gameboy");
  await page.getByRole("button", { name: "Apply dither" }).click();
  const header = async (factor: string) => {
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Save image" });
    await dialog
      .getByRole("button", { name: new RegExp(`^${factor}x,`) })
      .click();
    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Save PNG" }).click();
    const png = readFileSync((await (await download).path())!);
    // IHDR data: width, height, bit depth, color type.
    return {
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
      depth: png[24],
      colorType: png[25],
    };
  };

  // Game Boy: 4 colors, 2 bits per pixel, palette color type.
  expect(await header("1")).toEqual({
    width: 1800,
    height: 1200,
    depth: 2,
    colorType: 3,
  });
  expect(await header("2")).toMatchObject({ width: 3600, height: 2400 });
});

test("a transparent 1-bit background saves as a PNG with transparency", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await page.getByRole("checkbox", { name: "Transparent" }).click();
  await expect(page.getByLabel("Background", { exact: true })).toBeDisabled();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Rendered image is ready",
  );

  await page.getByRole("button", { name: "Save", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save image" });
  await dialog.getByRole("button", { name: /^1x,/ }).click();
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Save PNG" }).click();
  const png = readFileSync((await (await download).path())!);
  // Indexed, with a tRNS chunk marking the unlit color transparent.
  expect(png[25]).toBe(3);
  expect(png.includes(Buffer.from("tRNS"))).toBe(true);

  // Unchecking brings back a solid background.
  await page.getByRole("checkbox", { name: "Transparent" }).click();
  await expect(page.getByLabel("Background", { exact: true })).toBeEnabled();
});

test("after a reset, transparency toggles back to the default background", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  const background = page.getByLabel("Background", { exact: true });
  const transparent = page.getByRole("checkbox", { name: "Transparent" });
  await background.fill("#1e88e5");
  await expect(background).toHaveValue("#1e88e5");

  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Reset adjustments?" })
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await page.getByRole("button", { name: "Apply dither" }).click();
  await expect(background).toHaveValue("#000000");

  await transparent.click();
  await transparent.click();
  await expect(background).toHaveValue("#000000");

  // A color picked before turning transparency on still comes back.
  await background.fill("#e53935");
  await transparent.click();
  await transparent.click();
  await expect(background).toHaveValue("#e53935");
});

test("levels points can't cross and gamma sits in the middle", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await expect(page.getByRole("application")).toBeVisible();
  const black = page.getByRole("slider", { name: "Black point" });
  const white = page.getByRole("slider", { name: "White point" });
  const gamma = page.getByRole("slider", { name: "Gamma" });
  const value = async (slider: typeof black) =>
    Number(await slider.getAttribute("aria-valuenow"));
  const thumbLeft = (slider: typeof black) =>
    slider.evaluate((el) => (el.parentElement as HTMLElement).style.left);

  await expect(gamma).toHaveAttribute("aria-valuetext", "1.00");
  await gamma.focus();
  await page.keyboard.press("ArrowRight");
  await expect(gamma).not.toHaveAttribute("aria-valuetext", "1.00");

  // Moving one point never moves the other's thumb or changes its range.
  await black.focus();
  for (let i = 0; i < 64; i++) await page.keyboard.press("ArrowRight");
  const blackLeft = await thumbLeft(black);
  await white.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press("PageDown");
  expect(await thumbLeft(black)).toBe(blackLeft);
  await expect(black).toHaveAttribute("aria-valuemax", "254");

  // Pushing a point into the other stops one step short of it.
  const whiteValue = await value(white);
  await black.focus();
  await page.keyboard.press("End");
  await expect(black).toHaveAttribute("aria-valuenow", String(whiteValue - 1));
  await white.focus();
  await page.keyboard.press("Home");
  await expect(white).toHaveAttribute("aria-valuenow", String(whiteValue));

  // With the black point at its highest, the white point still moves
  // (away from it) and the black point can move back down.
  await page.keyboard.press("End");
  await black.focus();
  await page.keyboard.press("End");
  await expect(black).toHaveAttribute("aria-valuenow", "254");
  await expect(white).toHaveAttribute("aria-valuemin", "1");
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowLeft");
  await expect(black).toHaveAttribute("aria-valuenow", "244");
  await white.focus();
  await page.keyboard.press("Home");
  await expect(white).toHaveAttribute("aria-valuenow", "245");
});

/** Cheap fingerprint of what the canvas shows. */
function canvasPrint(page: Page) {
  return page
    .getByRole("application")
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => {
      const { data } = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height);
      let hash = 0;
      for (let i = 0; i < data.length; i += 7) hash = (hash * 31 + data[i]) | 0;
      return hash;
    });
}

test("every filter changes the image, and its reset restores it exactly", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Rendered image is ready",
  );
  const original = await canvasPrint(page);

  // Keys that move each slider off its default; blur needs a few steps
  // before it is visible at all.
  const moves: [string, string, number][] = [
    ["Black point", "PageUp", 1],
    ["Gamma", "PageUp", 1],
    ["White point", "PageDown", 1],
    ["Contrast", "PageUp", 1],
    ["Brightness", "PageUp", 1],
    ["Saturation", "PageUp", 3],
    ["Sharpen", "PageUp", 3],
    ["Noise", "PageUp", 1],
    ["Blur", "PageUp", 5],
  ];
  for (const [label, key, times] of moves) {
    await page.getByRole("slider", { name: label }).focus();
    for (let i = 0; i < times; i++) await page.keyboard.press(key);
    await expect
      .poll(() => canvasPrint(page), { message: `${label} changes the image` })
      .not.toBe(original);

    await page
      .getByRole("button", { name: `Reset ${label.toLowerCase()} to default` })
      .click();
    await expect
      .poll(() => canvasPrint(page), { message: `${label} reset restores it` })
      .toBe(original);
  }
});

test("every dot color control changes the image, and bands can't cross", async ({
  page,
}) => {
  await page.goto("/editor?sample=1");
  await page.getByRole("button", { name: "Apply dither" }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Rendered image is ready",
  );
  const shadows = page.getByRole("slider", { name: "Shadows" });
  const midtones = page.getByRole("slider", { name: "Midtones" });
  const changes = async (action: () => Promise<void>, what: string) => {
    const before = await canvasPrint(page);
    await action();
    await expect
      .poll(() => canvasPrint(page), { message: `${what} changes the image` })
      .not.toBe(before);
  };
  const pickColor = (label: string, color: string) =>
    page.getByLabel(label, { exact: true }).fill(color);
  const chooseCount = async (count: string) => {
    await page.getByRole("combobox", { name: "Dot colors" }).click();
    await page.getByRole("option", { name: count }).click();
  };

  await changes(() => pickColor("Highlights color", "#ffd54f"), "Highlights");
  await changes(() => chooseCount("3 colors"), "3 colors");
  await changes(async () => {
    await midtones.focus();
    await page.keyboard.press("PageUp");
  }, "Midtones range");
  await changes(async () => {
    await shadows.focus();
    await page.keyboard.press("PageDown");
  }, "Shadows range");
  await changes(() => pickColor("Midtones color", "#43a047"), "Midtones color");
  await changes(() => pickColor("Shadows color", "#8e24aa"), "Shadows color");
  await changes(() => pickColor("Background", "#263238"), "Background");

  // A background lighter than the dots turns them into ink.
  const background = page.getByLabel("Background", { exact: true });
  await expect(background).toHaveAccessibleDescription(/mark the light areas/);
  await changes(() => pickColor("Background", "#f4efe6"), "Light background");
  await expect(background).toHaveAccessibleDescription(/like ink/);

  // Shadows stop one step below midtones, and the other way around.
  await shadows.focus();
  await page.keyboard.press("End");
  const midValue = Number(await midtones.getAttribute("aria-valuenow"));
  await expect(shadows).toHaveAttribute("aria-valuenow", String(midValue - 1));
  await page.keyboard.press("Home");
  await midtones.focus();
  await page.keyboard.press("Home");
  await expect(midtones).toHaveAttribute("aria-valuenow", "1");

  // Ranges set with two colors are put in order when a third comes in.
  await chooseCount("2 colors");
  await midtones.focus();
  await page.keyboard.press("Home");
  await expect(midtones).toHaveAttribute("aria-valuenow", "0");
  await chooseCount("3 colors");
  await expect(midtones).toHaveAttribute("aria-valuenow", "1");
  await expect(shadows).toHaveAttribute("aria-valuenow", "0");
});
