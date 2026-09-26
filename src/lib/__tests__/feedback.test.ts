import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/editor/settings";
import { bugReportContext, bugReportUrl } from "@/lib/feedback";

const context = {
  settings: {
    ...DEFAULT_SETTINGS,
    algorithm: "atkinson" as const,
    scale: 0.35,
    color: {
      ...DEFAULT_SETTINGS.color,
      mode: "palette" as const,
      palette: "custom" as const,
      custom: ["#123456", "#abcdef"],
    },
  },
  status: "dithered" as const,
  source: { width: 1800, height: 1200 },
  result: { width: 630, height: 420 },
  userAgent: "Mozilla/5.0 (Test)",
};

describe("bug report link", () => {
  it("describes the settings, sizes and browser", () => {
    const text = bugReportContext(context);
    expect(text).toContain("Algorithm: atkinson");
    expect(text).toContain("Color: palette custom (match by color)");
    expect(text).toContain("Processing scale: 35%");
    expect(text).toContain("Image: 1800 × 1200 px");
    expect(text).toContain("Output: 630 × 420 px");
    expect(text).toContain("Browser: Mozilla/5.0 (Test)");
  });

  it("never includes custom colors", () => {
    expect(bugReportContext(context)).not.toMatch(/#123456|#abcdef/i);
  });

  it("pre-fills the bug form within GitHub's URL limit", () => {
    const url = new URL(bugReportUrl(context));
    expect(url.pathname).toBe("/m4rcone/pixel-synth/issues/new");
    expect(url.searchParams.get("template")).toBe("bug.yml");
    expect(url.searchParams.get("context")).toBe(bugReportContext(context));
    expect(url.toString().length).toBeLessThan(8000);
  });

  it("works before an image is loaded", () => {
    const text = bugReportContext({
      ...context,
      settings: DEFAULT_SETTINGS,
      status: "empty",
      source: null,
      result: null,
    });
    expect(text).toContain("Image: none");
    expect(text).toContain("Color: 1-bit, 1 dot color");
  });
});
