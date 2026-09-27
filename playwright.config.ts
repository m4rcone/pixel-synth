import { defineConfig, devices } from "@playwright/test";

// BASE_URL reuses an already running server (e.g. http://localhost:3000);
// when none is running, one starts on BASE_URL's port.
const baseURL =
  process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const port = Number(new URL(baseURL).port || 80);
// CI tests the production build (prerendering, static OG images, 404s); it
// runs `npm run build` in an earlier step.
const server = process.env.CI
  ? `npm run start -- --hostname 127.0.0.1 --port ${port}`
  : `npm run dev -- --hostname 127.0.0.1 --port ${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: server,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
