import { describe, expect, it } from "vitest";
import { ALGORITHM_GUIDES, guideTitle } from "@/lib/algorithm-guides";
import { ALGORITHMS, isAlgorithmId } from "@/lib/algorithms";
import { faqAnswerText, faqStructuredData, type FaqPart } from "@/lib/faq";
import { getPaletteGuide } from "@/lib/palette-guides";
import { isPaletteId } from "@/lib/palettes";
import { siteConfig } from "@/lib/site";

const links = (parts: FaqPart[]) =>
  parts.flatMap((part) => (typeof part === "string" ? [] : [part.href]));

describe.each(ALGORITHMS)("$slug guide", (algorithm) => {
  const guide = ALGORITHM_GUIDES[algorithm.slug];

  // Search engines truncate longer snippets.
  it("fits the title and description in a search snippet", () => {
    expect(
      `${guideTitle(algorithm)} | ${siteConfig.name}`.length,
    ).toBeLessThanOrEqual(60);
    expect(guide.description.length).toBeLessThanOrEqual(160);
  });

  it("compares itself with three other algorithms", () => {
    const slugs = guide.compare.map(({ slug }) => slug);
    expect(slugs[0]).toBe(algorithm.slug);
    expect(new Set(slugs).size).toBe(4);
  });

  it("links only to algorithms and palettes that exist", () => {
    const hrefs = [
      ...Object.values(guide.use).flatMap(links),
      ...guide.faq.flatMap((entry) => links(entry.answer)),
    ];
    for (const href of hrefs) {
      const algorithmLink = href.match(/^\/algorithms\/(.+)$/);
      const paletteLink = href.match(/^\/palettes#palette-(.+)$/);
      const guideLink = href.match(/^\/palettes\/(.+)$/);
      if (algorithmLink) expect(isAlgorithmId(algorithmLink[1])).toBe(true);
      else if (paletteLink) expect(isPaletteId(paletteLink[1])).toBe(true);
      else if (guideLink) expect(getPaletteGuide(guideLink[1])).toBeDefined();
      else expect(href).toBe("/editor?preset=pixel-art");
    }
  });

  it("mirrors the visible FAQ in its structured data", () => {
    const data = faqStructuredData(guide.faq);
    expect(data.mainEntity.map((item) => item.name)).toEqual(
      guide.faq.map((entry) => entry.question),
    );
    data.mainEntity.forEach((item, index) => {
      expect(item.acceptedAnswer.text).toBe(
        faqAnswerText(guide.faq[index].answer),
      );
    });
  });
});
