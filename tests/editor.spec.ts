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

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save" }).click();
  expect((await download).suggestedFilename()).toBe(
    "pixelsynth-floyd-steinberg.png",
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
