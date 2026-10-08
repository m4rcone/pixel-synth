import { describe, expect, it } from "vitest";
import { ALGORITHM_GUIDES } from "@/lib/algorithm-guides";
import { PALETTE_GUIDES } from "@/lib/palette-guides";
import { pageUpdated, siteConfig } from "@/lib/site";

// Search engines truncate longer snippets.
describe("site metadata", () => {
  it("keeps the home title and description within snippet limits", () => {
    expect(siteConfig.title.length).toBeLessThanOrEqual(60);
    expect(siteConfig.description.length).toBeLessThanOrEqual(160);
  });
});

describe("support link", () => {
  it("points at the Ko-fi page", () => {
    expect(siteConfig.links.support).toBe("https://ko-fi.com/m4rcone");
  });
});

describe("page update dates", () => {
  const dates = [
    siteConfig.updated,
    ...Object.values(siteConfig.pageUpdates),
    ...PALETTE_GUIDES.flatMap((guide) => guide.updated ?? []),
    ...Object.values(ALGORITHM_GUIDES).flatMap((guide) => guide.updated ?? []),
  ];

  it("are real dates, never before the site-wide one", () => {
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(date))).toBe(false);
      expect(date >= siteConfig.updated).toBe(true);
    }
  });

  it("prefer a page's own date, then its path's, then the site's", () => {
    expect(pageUpdated("/palettes/x", "2030-01-01")).toBe("2030-01-01");
    expect(pageUpdated("/editor")).toBe(siteConfig.pageUpdates["/editor"]);
    expect(pageUpdated("/algorithms")).toBe(siteConfig.updated);
  });
});
