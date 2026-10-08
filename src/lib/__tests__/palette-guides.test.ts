import { describe, expect, it } from "vitest";
import { isAlgorithmId } from "@/lib/algorithms";
import { faqAnswerText, faqStructuredData, type FaqPart } from "@/lib/faq";
import { PIXEL_ART_LINK } from "@/lib/editor/pixel-art";
import {
  getPaletteGuide,
  gplFile,
  guideForPalette,
  hexFile,
  PALETTE_GUIDES,
  paletteGuideTitle,
  paletteHref,
} from "@/lib/palette-guides";
import { parsePalette } from "@/lib/palette-import";
import { getPalettePreset, isPaletteId } from "@/lib/palettes";
import { siteConfig } from "@/lib/site";

const links = (parts: FaqPart[]) =>
  parts.flatMap((part) => (typeof part === "string" ? [] : [part.href]));

describe.each(PALETTE_GUIDES)("$slug palette guide", (guide) => {
  // Search engines truncate longer snippets.
  it("fits the title and description in a search snippet", () => {
    expect(
      `${paletteGuideTitle(guide)} | ${siteConfig.name}`.length,
    ).toBeLessThanOrEqual(60);
    expect(guide.description.length).toBeLessThanOrEqual(160);
  });

  it("names every color of the presets it shows", () => {
    for (const { id, names } of guide.palettes) {
      const preset = getPalettePreset(id);
      expect(preset).toBeDefined();
      if (names) expect(names).toHaveLength(preset!.colors.length);
    }
  });

  it("points to algorithms and palette pages that exist", () => {
    expect(guide.examples.every(isAlgorithmId)).toBe(true);
    for (const slug of guide.related) {
      expect(slug).not.toBe(guide.slug);
      expect(getPaletteGuide(slug)).toBeDefined();
    }
    const hrefs = [
      ...guide.sections.flatMap((s) => s.paragraphs.flatMap(links)),
      ...guide.steps.flatMap(links),
      ...guide.faq.flatMap((entry) => links(entry.answer)),
    ];
    for (const href of hrefs) {
      const algorithm = href.match(/^\/algorithms\/(.+)$/);
      const page = href.match(/^\/palettes\/(.+)$/);
      const card = href.match(/^\/palettes#palette-(.+)$/);
      if (algorithm) expect(isAlgorithmId(algorithm[1])).toBe(true);
      else if (page) expect(getPaletteGuide(page[1])).toBeDefined();
      else if (card) expect(isPaletteId(card[1])).toBe(true);
      else expect(href).toBe(PIXEL_ART_LINK);
    }
  });

  it("offers downloads the editor's importer reads back exactly", () => {
    for (const { id, names } of guide.palettes) {
      const preset = getPalettePreset(id)!;
      for (const file of [hexFile(preset), gplFile(preset, names)]) {
        const parsed = parsePalette(file);
        expect(parsed.ok && parsed.colors).toEqual([...new Set(preset.colors)]);
      }
    }
  });

  it("mirrors the visible FAQ in its structured data", () => {
    const data = faqStructuredData(guide.faq);
    data.mainEntity.forEach((item, index) => {
      expect(item.name).toBe(guide.faq[index].question);
      expect(item.acceptedAnswer.text).toBe(
        faqAnswerText(guide.faq[index].answer),
      );
    });
  });
});

describe("palette guide links", () => {
  it("gives each preset at most one guide", () => {
    const ids = PALETTE_GUIDES.flatMap((g) => g.palettes.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("links presets to their guide, others to their card", () => {
    expect(guideForPalette("gameboy-pocket")?.slug).toBe("game-boy");
    expect(paletteHref("gameboy")).toBe("/palettes/game-boy");
    expect(paletteHref("grayscale-4")).toBe("/palettes#palette-grayscale-4");
  });
});
