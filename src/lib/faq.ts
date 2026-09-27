/** Answer text, with optional internal links inside it. */
export type FaqPart = string | { text: string; href: string };

export type FaqEntry = { question: string; answer: FaqPart[] };

export function faqAnswerText(answer: FaqPart[]) {
  return answer
    .map((part) => (typeof part === "string" ? part : part.text))
    .join("");
}

/** FAQPage structured data with exactly the visible questions and answers. */
export function faqStructuredData(faq: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(entry.answer) },
    })),
  };
}
