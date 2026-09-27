import { describe, expect, it } from "vitest";
import { faqAnswerText, faqStructuredData } from "@/lib/faq";
import { HOME_FAQ } from "@/lib/home-faq";

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
});
