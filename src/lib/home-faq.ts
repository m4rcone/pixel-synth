import { EXPORT_FACTORS } from "@/lib/editor/export";
import { PIXEL_ART_LINK } from "@/lib/editor/pixel-art";
import type { FaqEntry } from "@/lib/faq";
import { siteConfig } from "@/lib/site";
import { MAX_PALETTE_COLORS, MIN_PALETTE_COLORS } from "@/lib/palettes";

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
    question: "Is it free and private?",
    answer: [
      "Yes. No account, no watermark, no usage limits, and every pixel is processed in your browser: your images never leave your device. The anonymous page-view counter never sees them. If it’s useful to you, you can ",
      { text: "support it on Ko-fi", href: siteConfig.links.support },
      ".",
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
      { text: "Game Boy palette", href: "/palettes/game-boy" },
      ", or apply the ",
      { text: "pixel art preset", href: PIXEL_ART_LINK },
      " and switch its palette to Game Boy.",
    ],
  },
  {
    question: "Can I use my own palette, like one from Lospec?",
    answer: [
      "Yes. Choose the ",
      { text: "Custom palette", href: "/palettes#palette-custom" },
      ` and press Import: paste hex codes, or open a palette file downloaded from Lospec (HEX, GPL, PAL or Paint.NET TXT). It takes ${MIN_PALETTE_COLORS} to ${MAX_PALETTE_COLORS} colors.`,
    ],
  },
  {
    question: "Can I use it for album covers, posters or social posts?",
    answer: [
      `Yes. Export PNGs up to ×${EXPORT_FACTORS.at(-1)}, enlarged without smoothing, so the dots stay crisp at any size. In 1-bit mode, give the dots up to three colors and make the background transparent to lay the dither over other artwork.`,
    ],
  },
  {
    question: "Can I use it for laser engraving?",
    answer: [
      "Yes. Stay in 1-bit, pick ",
      { text: "Atkinson", href: "/algorithms/atkinson" },
      " or ",
      { text: "Floyd–Steinberg", href: "/algorithms/floyd-steinberg" },
      ", set the output size to the width in pixels your engraving needs (up to the image’s own width) and save the PNG at ×1. The file carries no DPI, so set the physical size in your laser software, and turn off its own dithering.",
    ],
  },
];
