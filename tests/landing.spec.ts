import { expect, test } from "@playwright/test";

test("every internal landing link resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")!)),
    ]);
  // Palette thumbnails, use cases, FAQ and footer.
  expect(hrefs).toEqual(
    expect.arrayContaining([
      "/palettes#palette-pico8",
      "/algorithms/clustered-dot-halftone-ordered",
      "/algorithms/blue-noise",
      "/editor?preset=pixel-art",
    ]),
  );

  for (const href of hrefs) {
    const [path, anchor] = href.split("#");
    const response = await request.get(path);
    expect(response.status(), href).toBe(200);
    if (anchor) expect(await response.text(), href).toContain(`id="${anchor}"`);
  }
});

test("a palette thumbnail opens that palette in the gallery", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("region", { name: "Classic palettes, one click away" })
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
