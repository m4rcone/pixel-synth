import { SUPPORTED_FORMATS_LABEL } from "@/lib/editor/load-image";

/** Answer text, with optional internal links inside it. */
export type FaqPart = string | { text: string; href: string };

export type FaqEntry = { question: string; answer: FaqPart[] };

/**
 * The landing page FAQ. The visible list and the FAQPage structured data are
 * both built from this array, so they can't drift apart.
 */
export const HOME_FAQ: FaqEntry[] = [
  {
    question: "What is dithering?",
    answer: [
      "A way to show more tones than a palette has by arranging its colors in patterns of dots, so the eye blends them.",
    ],
  },
  {
    question: "Is PixelSynth free?",
    answer: ["Yes. No account, no watermark, no usage limits."],
  },
  {
    question: "Are my images uploaded?",
    answer: [
      "No. Every pixel is processed in your browser. The anonymous page-view counter never sees your images.",
    ],
  },
  {
    question: "Which algorithm should I use?",
    answer: [
      { text: "Floyd–Steinberg", href: "/algorithms/floyd-steinberg" },
      " for detail, ",
      { text: "Atkinson", href: "/algorithms/atkinson" },
      " for crisp retro highlights, ",
      { text: "Bayer", href: "/algorithms/bayer-8-8" },
      " for a regular pattern, ",
      { text: "Blue Noise", href: "/algorithms/blue-noise" },
      " for a smooth grain.",
    ],
  },
  {
    question: "How do I make Game Boy style images?",
    answer: [
      "Choose the ",
      { text: "Game Boy palette", href: "/palettes#palette-gameboy" },
      ", or apply the ",
      { text: "pixel art preset", href: "/editor?preset=pixel-art" },
      " and switch its palette to Game Boy.",
    ],
  },
  {
    question: "Which formats are supported?",
    answer: [
      `${SUPPORTED_FORMATS_LABEL.replace(" or ", " and ")} in; PNG out, enlarged ×1 to ×8.`,
    ],
  },
];

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
