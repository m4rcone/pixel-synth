import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TINY_PNG = Buffer.from(
  // 4×4 RGB gradient
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAANklEQVR4nGNgYGCwsbGpqKjYsmULg4iISEBAQE9Pz4kTJxg0NDRSUlIWLFhw584dhJoPHz4AAOIjFoHzOnRsAAAAAElFTkSuQmCC",
  "base64",
);

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function uploadTinyImage(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/drop an image/i).setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
}

test.describe("accessibility", () => {
  for (const route of [
    "/",
    "/editor",
    "/algorithms",
    "/algorithms/floyd-steinberg",
    "/algorithms/blue-noise",
    "/algorithms/random-dither",
    "/palettes",
  ]) {
    test(`has no axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      await expectNoAccessibilityViolations(page);
    });
  }

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("help popover opens from the keyboard", async ({ page }) => {
    await page.goto("/editor");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Editor help" }).focus();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("dialog", { name: "Editor help" }),
    ).toContainText("Processing scale");
    // Let the open animation finish so contrast is measured at rest.
    await page.waitForTimeout(400);
    await expectNoAccessibilityViolations(page);
  });

  test("upload exposes the canvas and live status", async ({ page }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);

    await expect(
      page.getByRole("application", { name: "Original image canvas" }),
    ).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      "Image uploaded",
    );
  });

  test("canvas supports keyboard zoom, pan, and reset", async ({ page }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);

    const canvas = page.getByRole("application", {
      name: "Original image canvas",
    });
    await canvas.focus();

    await page.keyboard.press("=");
    await expect(page.getByText("Zoom 120%", { exact: true })).toBeVisible();

    await page.keyboard.press("-");
    await expect(page.getByText("Zoom 100%", { exact: true })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      "Canvas panned right.",
    );

    await page.keyboard.press("0");
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      "Canvas view reset.",
    );
  });

  test("icon-only canvas buttons have accessible names", async ({ page }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);

    await expect(
      page.getByRole("button", { name: "Show processed image" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset view" }),
    ).toBeVisible();
  });

  test("dithered editor with every control enabled has no axe violations", async ({
    page,
  }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);
    await page.getByRole("button", { name: "Apply dither" }).click();
    await expect(
      page.getByRole("button", { name: "Reset", exact: true }),
    ).toBeVisible();

    await expectNoAccessibilityViolations(page);
  });

  test("palette controls and the save dialog have no axe violations", async ({
    page,
  }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);
    await page.getByRole("button", { name: "Apply dither" }).click();
    await page.getByRole("button", { name: "Palette", exact: true }).click();
    await page.getByRole("button", { name: "Edit colors" }).click();
    await expectNoAccessibilityViolations(page);

    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("dialog", { name: "Save image" }),
    ).toBeVisible();
    // Let the open animation finish so contrast is measured at rest.
    await page.waitForTimeout(400);
    await expectNoAccessibilityViolations(page);
  });

  test("the share settings popover has no axe violations", async ({ page }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);
    await page.getByRole("button", { name: "Share settings" }).click();
    await expect(page.getByLabel("Settings link")).toBeVisible();
    await page.waitForTimeout(400);
    await expectNoAccessibilityViolations(page);
  });

  test("slider values can be reset from the keyboard", async ({ page }) => {
    await page.goto("/editor");
    await uploadTinyImage(page);

    const contrast = page.getByRole("slider", { name: "Contrast" });
    await contrast.focus();
    await page.keyboard.press("ArrowRight");
    await expect(contrast).toHaveAttribute("aria-valuetext", "0.01");

    await page
      .getByRole("button", { name: "Reset contrast to default" })
      .click();
    await expect(contrast).toHaveAttribute("aria-valuetext", "0.00");
  });

  test("landing specimen is operable without a pointer", async ({ page }) => {
    await page.goto("/");

    const divider = page.getByRole("slider", {
      name: "Before and after divider",
    });
    await divider.focus();
    await page.keyboard.press("Home");
    await expect(divider).toHaveAttribute("aria-valuenow", "0");

    const pause = page.getByRole("button", { name: "Pause slideshow" });
    await pause.click();
    await expect(
      page.getByRole("button", { name: "Play slideshow" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Bayer 8×8" }).click();
    await expect(
      page.getByRole("button", { name: "Bayer 8×8" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("accessibility on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of [
    "/",
    "/editor",
    "/algorithms",
    "/algorithms/bayer-4-4",
    "/palettes",
  ]) {
    test(`has no axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expectNoAccessibilityViolations(page);
    });
  }
});
