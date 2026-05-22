import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function uploadTinyImage(page: Page) {
  await page.getByLabel("Click to start").setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
}

test.describe("accessibility", () => {
  for (const route of ["/", "/editor", "/algorithms"]) {
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

  test("help tooltip opens from keyboard focus", async ({ page }) => {
    await page.goto("/editor");

    const helpButton = page.getByRole("button", {
      name: "Show dither control help",
    });
    await helpButton.focus();

    await expect(page.getByRole("tooltip")).toContainText("Dither Controls");
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
    await expect(page.getByText("Zoom: 120%")).toBeVisible();

    await page.keyboard.press("-");
    await expect(page.getByText("Zoom: 100%")).toBeVisible();

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
    await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();
  });
});
