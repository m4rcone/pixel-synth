import { describe, expect, it } from "vitest";
import { SUPPORTED_IMAGE_TYPES } from "@/lib/editor/load-image";
import { faqAnswerText, faqStructuredData, HOME_FAQ } from "@/lib/home-faq";

describe("home FAQ", () => {
  it("structured data mirrors the visible questions and answers", () => {
    const data = faqStructuredData(HOME_FAQ);
    expect(data.mainEntity).toHaveLength(HOME_FAQ.length);
    data.mainEntity.forEach((item, index) => {
      expect(item.name).toBe(HOME_FAQ[index].question);
      expect(item.acceptedAnswer.text).toBe(
        faqAnswerText(HOME_FAQ[index].answer),
      );
      expect(item.acceptedAnswer.text).not.toMatch(/[<>]/);
    });
  });

  it("lists every supported input format", () => {
    const formats = faqAnswerText(
      HOME_FAQ.find((e) => e.question.includes("formats"))!.answer,
    );
    for (const type of SUPPORTED_IMAGE_TYPES) {
      const name = type.replace("image/", "");
      expect(formats.toLowerCase()).toContain(name);
    }
  });
});
