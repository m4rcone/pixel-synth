import { expect, test } from "@playwright/test";

test("every internal landing link resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")!)),
    ]);
  // Hero, algorithm grid, palette cartridges, FAQ and footer.
  expect(hrefs).toEqual(
    expect.arrayContaining([
      "/editor?sample=1&algorithm=floyd-steinberg",
      "/algorithms/void-and-cluster",
      "/palettes#palette-pixelsynth",
      "/palettes/pico-8",
      "/algorithms/clustered-dot-halftone-ordered",
      "/algorithms/blue-noise",
      "/editor?preset=pixel-art",
      "/editor?sample=animated",
    ]),
  );

  for (const href of hrefs) {
    const [path, anchor] = href.split("#");
    const response = await request.get(path);
    expect(response.status(), href).toBe(200);
    if (anchor) expect(await response.text(), href).toContain(`id="${anchor}"`);
  }
});

test("a palette cartridge opens that palette's page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("region", { name: "Retro palettes: Game Boy, NES, PICO-8, CGA" })
    .getByRole("link", { name: "PICO-8" })
    .click();

  await expect(page).toHaveURL(/\/palettes\/pico-8$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "PICO-8 Palette" }),
  ).toBeFocused();
});

test("a cartridge without a page opens its card in the gallery", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("region", { name: "Retro palettes: Game Boy, NES, PICO-8, CGA" })
    .getByRole("link", { name: "Your colors" })
    .click();

  await expect(page).toHaveURL(/\/palettes#group-dynamic$/);
  await expect(page.locator("#group-dynamic")).toBeInViewport();
});

test("the FAQ opens from the keyboard", async ({ page }) => {
  await page.goto("/");
  const question = page.getByText("Is it free and private?");
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/your images never leave your device/),
  ).toBeVisible();
});

test("the pixel art button waits for the visitor's own image", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the pixel art preset" }).click();
  await expect(page).toHaveURL(/\/editor\?preset=pixel-art$/);

  // Nothing is loaded for the visitor: the upload area is shown.
  const input = page.getByLabel(/drop an image/i);
  await expect(input).toBeAttached();
  await expect(
    page.getByRole("application", { name: /image canvas/ }),
  ).toHaveCount(0);

  // Their image gets the preset, sized for it: 250×250 → 111×111.
  await input.setInputFiles("tests/fixtures/sphere-250.png");
  await expect(page.getByLabel("Output size")).toHaveValue("111");
  await expect(page.getByRole("combobox", { name: "Algorithm" })).toHaveText(
    "Bayer 2×2",
  );
  await expect(page.getByRole("combobox", { name: "Palette" })).toContainText(
    "PICO-8",
  );
});

test("the hero steps through algorithms and palettes", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("figure").first();
  const link = hero.getByRole("link", { name: "Open this look in the editor" });

  // Opens on Floyd–Steinberg in 1-bit: the editor's defaults, no palette.
  await expect(hero.getByRole("group", { name: "Algorithm" })).toContainText(
    "Floyd–Steinberg01/17",
  );
  await expect(link).toHaveAttribute(
    "href",
    "/editor?sample=1&algorithm=floyd-steinberg",
  );

  // 1-bit isn't a palette, so the counter only numbers the presets.
  const palettes = hero.getByRole("group", { name: "Palette" });
  await expect(palettes).toContainText("--/17");

  await hero.getByRole("button", { name: "Next palette" }).click();
  await hero.getByRole("button", { name: "Previous algorithm" }).click();
  await expect(palettes).toContainText("Game Boy01/17");

  // Previous from the first algorithm wraps to the last.
  await expect(
    hero.getByRole("img", {
      name: /dithered with Line Screen and the Game Boy palette/,
    }),
  ).toHaveAttribute("src", "/landing/synthwave-sunset-line-screen-gameboy.png");
  await expect(link).toHaveAttribute(
    "href",
    "/editor?sample=1&algorithm=line-screen&palette=gameboy",
  );
});

test("a two-palette page switches every preview and editor link", async ({
  page,
}) => {
  await page.goto("/palettes/game-boy");
  await page.waitForLoadState("networkidle");
  const editorLink = page.getByRole("link", {
    name: "Use Game Boy in the editor",
  });
  await expect(editorLink).toHaveAttribute("href", "/editor?palette=gameboy");

  await page
    .getByRole("group", { name: "Palette shown", exact: true })
    .getByRole("button", { name: "Game Boy Pocket" })
    .click();

  await expect(
    page.getByRole("link", { name: "Use Game Boy Pocket in the editor" }),
  ).toHaveAttribute("href", "/editor?palette=gameboy-pocket");
  await expect(
    page.getByRole("button", { name: "Game Boy Pocket" }).last(),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByAltText(/dithered to the Game Boy Pocket palette with Bayer 4×4/),
  ).toHaveAttribute("src", /synthwave-sunset-bayer-4-4-gameboy-pocket\.png/);
});

test("the footer links to Ko-fi in a new tab", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const name of [/Support on Ko-fi/, /Buy me a coffee/]) {
    const link = footer.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", "https://ko-fi.com/m4rcone");
    await expect(link).toHaveAttribute("target", "_blank");
  }
});

test("the footer links palettes to their own pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: "Game Boy", exact: true }),
  ).toHaveAttribute("href", "/palettes/game-boy");
  // A palette without a page still lands on its gallery card.
  await expect(
    footer.getByRole("link", { name: "Grayscale 4", exact: true }),
  ).toHaveAttribute("href", "/palettes#palette-grayscale-4");
});
