import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";

// Search engines truncate longer snippets.
describe("site metadata", () => {
  it("keeps the home title and description within snippet limits", () => {
    expect(siteConfig.title.length).toBeLessThanOrEqual(60);
    expect(siteConfig.description.length).toBeLessThanOrEqual(160);
  });
});
