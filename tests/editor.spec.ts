import { expect, test, type Page } from "@playwright/test";

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

test("1-bit mode names its dot colors and shading", async ({ page }) => {
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
  await page.getByRole("checkbox", { name: "Shade by brightness" }).check();
  await expect(
    page.getByRole("checkbox", { name: "Shade by brightness" }),
  ).toBeChecked();
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

test("editing the NES palette keeps all 54 colors", async ({ page }) => {
  await page.goto("/editor?sample=1&palette=nes");
  await page.getByRole("button", { name: "Edit colors" }).click();
  await expect(page.getByLabel(/^Color \d+$/)).toHaveCount(54);
});
