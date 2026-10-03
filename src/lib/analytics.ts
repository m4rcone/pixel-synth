/** Google Analytics 4 property. */
export const GA_MEASUREMENT_ID = "G-TVJ6F2REK9";

/**
 * Google Analytics and its consent banner run on production deploys only, so
 * previews, local builds and the Playwright runs neither send hits nor show
 * the banner. Server-side only: VERCEL_ENV is not exposed to the client.
 */
export function analyticsEnabled() {
  return process.env.VERCEL_ENV === "production";
}
