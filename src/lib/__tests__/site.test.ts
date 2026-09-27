import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";

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
