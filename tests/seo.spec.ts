import { expect, test } from "@playwright/test";
import { ALGORITHMS } from "../src/lib/algorithms";
import { PALETTE_GUIDES } from "../src/lib/palette-guides";
import { siteConfig } from "../src/lib/site";

const PAGES = [
  "/",
  "/editor",
  "/algorithms",
  "/palettes",
  ...ALGORITHMS.map((algorithm) => `/algorithms/${algorithm.slug}`),
  ...PALETTE_GUIDES.map((guide) => `/palettes/${guide.slug}`),
];

test("the sitemap lists every page", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => new URL(url).pathname,
  );
  expect(urls.sort()).toEqual([...PAGES].sort());
});

test("robots.txt points at the sitemap", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).toContain(`Sitemap: ${siteConfig.url}/sitemap.xml`);
});

test("pages have a canonical URL and valid structured data", async ({
  request,
}) => {
  for (const path of PAGES) {
    const html = await (await request.get(path)).text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical, path).toBe(`${siteConfig.url}${path}`.replace(/\/$/, ""));
    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json">([^<]*)<\/script>/g,
    )) {
      const data = JSON.parse(json);
      for (const item of [data].flat()) {
        expect(item["@context"], path).toBe("https://schema.org");
        expect(item["@type"], path).toBeTruthy();
      }
    }
  }
});

test("Open Graph images render", async ({ request }) => {
  for (const path of [
    "/",
    "/algorithms",
    `/algorithms/${ALGORITHMS[0].slug}`,
    `/palettes/${PALETTE_GUIDES[0].slug}`,
  ]) {
    const html = await (await request.get(path)).text();
    const image = html.match(
      /<meta property="og:image" content="([^"]+)"/,
    )?.[1];
    expect(image, path).toBeTruthy();
    const response = await request.get(new URL(image!).pathname);
    expect(response.headers()["content-type"], path).toBe("image/png");
  }
});
