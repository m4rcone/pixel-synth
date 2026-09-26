import { expect, test } from "@playwright/test";

test("every internal landing link resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")!)),
    ]);
  // Hero, algorithm grid, palette cartridges, modes, FAQ and footer.
  expect(hrefs).toEqual(
    expect.arrayContaining([
      "/editor?sample=1&algorithm=floyd-steinberg",
      "/algorithms/void-and-cluster",
      "/palettes#palette-enhance",
      "/palettes#palette-pico8",
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

test("a palette cartridge opens that palette in the gallery", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("region", { name: "Retro palettes: Game Boy, NES, PICO-8, CGA" })
    .getByRole("link", { name: "PICO-8" })
    .click();

  await expect(page).toHaveURL(/\/palettes#palette-pico8$/);
  await expect(page.locator("#palette-pico8")).toBeFocused();
  await expect(page.locator("#palette-pico8")).toBeInViewport();
});

test("the FAQ opens from the keyboard", async ({ page }) => {
  await page.goto("/");
  const question = page.getByText("Are my images uploaded?");
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Every pixel is processed in your browser."),
  ).toBeVisible();
});

test("the pixel art button waits for the user's image", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the pixel art preset" }).click();
  await expect(page).toHaveURL(/\/editor\?preset=pixel-art$/);

  // Nothing is loaded for the user: the upload area is shown.
  // Client-side navigation: the editor is hydrated already.
  await expect(page.getByLabel(/drop an image/i)).toBeAttached();
  await page.getByRole("button", { name: "Try a sample image" }).click();

  // Sample 1800×1200 → 136×91, dithered right away.
  await expect(page.getByLabel("Output size")).toHaveValue("136");
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

  await hero.getByRole("button", { name: "Next palette" }).click();
  await hero.getByRole("button", { name: "Previous algorithm" }).click();

  // Previous from the first algorithm wraps to the last.
  await expect(
    hero.getByRole("img", {
      name: /dithered with Line Screen and the Game Boy palette/,
    }),
  ).toHaveAttribute("src", "/landing/sunset-line-screen-gameboy.png");
  await expect(link).toHaveAttribute(
    "href",
    "/editor?sample=1&algorithm=line-screen&palette=gameboy",
  );
});

test("the CMYK link opens the sample separated into inks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try CMYK separation" }).click();
  await expect(page).toHaveURL(/\/editor\?sample=1&s=/);
  await expect(
    page.getByRole("button", { name: "CMYK", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
