/**
 * Long-form copy of each algorithm page (/algorithms/<slug>). The fact sheet,
 * the weight diagram and the pseudocode come from the catalog and the engine;
 * this holds the prose around them. Keep it true to what the engine does
 * (src/lib/editor/dither.ts, matrices.ts, screen.ts).
 */

import {
  ditheringName,
  getAlgorithm,
  type Algorithm,
  type AlgorithmId,
} from "@/lib/algorithms";
import type { FaqEntry, FaqPart } from "@/lib/faq";
import { paletteHref } from "@/lib/palette-guides";

export type AlgorithmGuide = {
  /** Meta description, at most 160 characters. */
  description: string;
  /** Lede under the title. */
  intro: string;
  /** "How it works" paragraphs, before the weight diagram. */
  method: string[];
  /** "When to use it" points. */
  use: {
    bestFor: FaqPart[];
    worksWith: FaqPart[];
    watchOut: FaqPart[];
    animation: FaqPart[];
  };
  /** Comparison rows: this algorithm first, then three others. */
  compare: { slug: AlgorithmId; look: string }[];
  faq: FaqEntry[];
};

const algo = (slug: AlgorithmId, text?: string): FaqPart => ({
  text: text ?? getAlgorithm(slug)!.shortName,
  href: `/algorithms/${slug}`,
});

const palette = (id: string, text: string): FaqPart => ({
  text,
  href: paletteHref(id),
});

const RETRO_PALETTES: FaqPart[] = [
  palette("gameboy", "Game Boy"),
  ", ",
  palette("pico8", "PICO-8"),
  " or ",
  palette("nes", "NES"),
];

const DIFFUSION_FLICKER: FaqPart[] = [
  "Like every error diffusion, it flickers: a small change in one frame moves every later dot. For GIFs, ",
  algo("bayer-8-8"),
  " or ",
  algo("blue-noise"),
  " keep their dots in place.",
];

const ORDERED_STABLE =
  "Very stable. Each pixel’s threshold depends only on its position, so areas that don’t move stay identical from frame to frame, with no shimmer.";

const colorFaq = (name: string): FaqEntry => ({
  question: `Can I use ${name} with color palettes?`,
  answer: [
    `Yes. With a palette matched by color, ${name} works on the red, green and blue channels, so it handles any palette, from `,
    palette("gameboy", "Game Boy"),
    " greens to the ",
    palette("nes", "NES"),
    " colors. Matched by brightness, it dithers along the palette’s dark-to-light ramp instead.",
  ],
});

export const ALGORITHM_GUIDES: Record<AlgorithmId, AlgorithmGuide> = {
  "floyd-steinberg": {
    description:
      "Learn how Floyd–Steinberg dithering spreads error to 4 neighbors, see it before and after, compare it to Atkinson and Bayer, and try it free in your browser.",
    intro:
      "Floyd–Steinberg is the most widely used error-diffusion dithering algorithm. Published by Robert W. Floyd and Louis Steinberg in 1976, it reduces a grayscale or color image to a few colors, even pure black and white, while keeping smooth gradients and fine detail. Drag the slider to compare, then try it on your own image; nothing is uploaded.",
    method: [
      "The image is scanned pixel by pixel. Each pixel is rounded to the nearest available color, and the rounding error is passed on to four neighbors that haven’t been processed yet: 7/16 to the right, 3/16 below-left, 5/16 below and 1/16 below-right. Because all of the error is carried forward, the average brightness of every area is preserved: a 25% gray comes out as roughly one lit pixel in four.",
      "The weights were chosen so that a flat 50% gray becomes a clean checkerboard. PixelSynth scans rows in alternating directions (serpentine), mirroring the weights on right-to-left rows, which breaks up the diagonal streaks a strict left-to-right scan leaves behind.",
    ],
    use: {
      bestFor: [
        "photos, portraits and gradients where you want as much detail as possible from very few colors.",
      ],
      worksWith: [
        "1-bit output and small retro palettes like ",
        ...RETRO_PALETTES,
        ".",
      ],
      watchOut: [
        "“worm” patterns, short chains of dots, in flat midtones and in areas close to white or black.",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "floyd-steinberg", look: "Smooth, detailed, balanced" },
      {
        slug: "atkinson",
        look: "Higher contrast, classic Mac look, loses shadow detail",
      },
      {
        slug: "jarvis-judice-and-ninke-jjn",
        look: "Smoother, fewer worms, slower",
      },
      { slug: "bayer-8-8", look: "Visible grid pattern, stable in animation" },
    ],
    faq: [
      {
        question: "Is Floyd–Steinberg the best dithering algorithm?",
        answer: [
          "It’s the best all-rounder for still images. ",
          algo("atkinson"),
          " gives more contrast, ",
          algo("jarvis-judice-and-ninke-jjn"),
          " smoother gradients, and ",
          algo("bayer-8-8", "Bayer"),
          " or ",
          algo("blue-noise"),
          " are better for animation.",
        ],
      },
      colorFaq("Floyd–Steinberg"),
      {
        question: "How do I get rid of worm patterns?",
        answer: [
          "Lower the Error diffusion slider in the editor so less error travels from pixel to pixel, add a touch of noise in the filters, or switch to an algorithm with a wider spread such as ",
          algo("stucki"),
          ".",
        ],
      },
    ],
  },

  "jarvis-judice-and-ninke-jjn": {
    description:
      "How Jarvis–Judice–Ninke dithering spreads error over 12 neighbors for smoother gradients than Floyd–Steinberg. Examples, comparison and a free online tool.",
    intro:
      "Jarvis, Judice and Ninke (JJN) is an error-diffusion algorithm that spreads each pixel’s error over 12 neighbors across three rows. J. F. Jarvis, C. N. Judice and W. H. Ninke of Bell Labs described it in 1976, the same year as Floyd–Steinberg, in a survey of ways to show continuous-tone pictures on two-level displays. The wider spread gives smoother gradients and fewer artifacts, at the cost of speed.",
    method: [
      "Pixels are processed one at a time and rounded to the nearest available color. The error is split into 48ths: 7 and 5 go to the next two pixels on the same row, and the two rows below receive weights that fall off with distance, 3, 5, 7, 5, 3 and then 1, 3, 5, 3, 1. All 48/48 of the error is carried forward.",
      "Because each pixel’s error is shared by three times as many neighbors as in Floyd–Steinberg, no single neighbor gets a large push, and the dots settle into a more even, less structured texture. The price is three times as many updates per pixel and a slightly softer rendering of fine edges, which the wider spread blurs a little.",
    ],
    use: {
      bestFor: [
        "photos with large smooth gradients, like skies and skin, where Floyd–Steinberg shows worms.",
      ],
      worksWith: [
        "1-bit and grayscale output, and palettes with only a few colors.",
      ],
      watchOut: [
        "slower renders on large images, and edges a touch softer than with ",
        algo("floyd-steinberg"),
        " or ",
        algo("stucki"),
        ".",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      {
        slug: "jarvis-judice-and-ninke-jjn",
        look: "Smooth, even, slightly soft",
      },
      { slug: "floyd-steinberg", look: "Sharper, more worms, faster" },
      { slug: "stucki", look: "Same footprint, a little crisper" },
      { slug: "sierra", look: "Close to JJN, less work" },
    ],
    faq: [
      {
        question: "Is JJN dithering slow?",
        answer: [
          "It updates 12 neighbors per pixel instead of 4, so it does about three times the work of Floyd–Steinberg. PixelSynth runs it in a background worker, so large images take a moment longer but the page stays responsive.",
        ],
      },
      {
        question: "Why is it called JJN?",
        answer: [
          "After its authors, J. F. Jarvis, C. N. Judice and W. H. Ninke, who published it in 1976. It’s also known as minimized average error dithering.",
        ],
      },
    ],
  },

  stucki: {
    description:
      "Stucki dithering refines Jarvis–Judice–Ninke with simpler weights for crisp, clean detail. See how it works, compare it and try it free in your browser.",
    intro:
      "Stucki is an error-diffusion algorithm introduced by Peter Stucki at IBM Research in 1981. It uses the same 12-neighbor footprint as Jarvis–Judice–Ninke, but with weights that are powers of two and a steeper falloff, which gives a crisper, cleaner result with excellent detail.",
    method: [
      "Each pixel is rounded to the nearest available color and its error is split into 42nds: 8 and 4 to the next two pixels on the same row, 2, 4, 8, 4, 2 on the row below and 1, 2, 4, 2, 1 two rows down. All of the error is carried forward.",
      "Weights that are powers of two were cheap for the hardware of the time, since multiplying by 8, 4 or 2 is a bit shift. And because more of the error stays next to the current pixel than in JJN (8/42 instead of 7/48), edges stay sharper while the wide footprint still smooths out gradients.",
    ],
    use: {
      bestFor: [
        "detailed photos and illustrations where you want JJN’s smoothness with sharper edges.",
      ],
      worksWith: [
        "1-bit output, laser engraving and grayscale palettes like ",
        palette("grayscale-4", "Grayscale 4"),
        ".",
      ],
      watchOut: [
        "the same cost as JJN, 12 neighbors per pixel; ",
        algo("burkes"),
        " looks nearly the same for less work.",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "stucki", look: "Crisp, clean, detailed" },
      {
        slug: "jarvis-judice-and-ninke-jjn",
        look: "Same footprint, slightly softer",
      },
      { slug: "burkes", look: "Nearly identical, two rows, faster" },
      { slug: "floyd-steinberg", look: "Tighter spread, more worms" },
    ],
    faq: [
      {
        question: "Is Stucki good for laser engraving?",
        answer: [
          "Yes. It keeps fine detail and gives clean, well-separated dots. Stay in 1-bit, set the output width to what your engraver needs and save the PNG at ×1, then turn off the laser software’s own dithering.",
        ],
      },
      {
        question: "Why does Stucki divide by 42?",
        answer: [
          "Its weights add up to 42, so dividing by 42 hands out exactly all of the error. The weights themselves are powers of two, which 1980s hardware could apply with bit shifts.",
        ],
      },
    ],
  },

  burkes: {
    description:
      "Burkes dithering keeps Stucki’s weights on two rows instead of three, for nearly the same quality with less work. How it works, examples and a free online tool.",
    intro:
      "Burkes is an error-diffusion algorithm by Daniel Burkes, shared in 1988 as a simplification of Stucki. It keeps Stucki’s first two rows of weights and drops the third, so each pixel’s error reaches 7 neighbors instead of 12. The result looks nearly the same as Stucki and renders noticeably faster.",
    method: [
      "Each pixel is rounded to the nearest available color and the error is split into 32nds: 8 and 4 go to the next two pixels on the same row, and 2, 4, 8, 4, 2 to the five pixels below. All of the error is carried forward, over two rows only.",
      "Dividing by 32 is a single bit shift, which Stucki’s 42 is not, and only one row ahead has to be kept in memory. Dropping the third row makes the texture slightly less smooth than Stucki’s in large gradients, but on most images the two are hard to tell apart.",
    ],
    use: {
      bestFor: [
        "large images and quick iteration, when you want Stucki-like quality.",
      ],
      worksWith: [
        "1-bit, grayscale and retro palettes like ",
        ...RETRO_PALETTES,
        ".",
      ],
      watchOut: [
        "slightly more structure than ",
        algo("stucki"),
        " or ",
        algo("jarvis-judice-and-ninke-jjn", "JJN"),
        " in wide, smooth gradients.",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "burkes", look: "Crisp, balanced, efficient" },
      { slug: "stucki", look: "Marginally smoother, slower" },
      { slug: "floyd-steinberg", look: "4 neighbors, more worms" },
      { slug: "atkinson", look: "Only 3/4 of the error, more contrast" },
    ],
    faq: [
      {
        question: "When should I pick Burkes over Floyd–Steinberg?",
        answer: [
          "When ",
          algo("floyd-steinberg"),
          " shows worms in smooth areas. Burkes spreads the error wider, over 7 neighbors on two rows, for a more even texture, while staying cheaper than Stucki or JJN.",
        ],
      },
      colorFaq("Burkes"),
    ],
  },

  sierra: {
    description:
      "Sierra dithering spreads error over 10 neighbors on three rows, close to JJN quality for less work. Learn how it works, compare it and try it free online.",
    intro:
      "Sierra, sometimes called Sierra-3, is an error-diffusion algorithm Frankie Sierra published in 1989. It spreads each pixel’s error over 10 neighbors across three rows, a footprint close to Jarvis–Judice–Ninke’s but with fewer, simpler weights. It gives natural, crisp textures and smooth gradients at a lower cost than JJN.",
    method: [
      "Each pixel is rounded to the nearest available color and its error split into 32nds: 5 and 3 to the next two pixels on the row, 2, 4, 5, 4, 2 on the row below, and 2, 3, 2 on the three pixels centered two rows down. All of the error is carried forward.",
      "Compared with JJN, Sierra drops the two outer corners of the bottom row and divides by 32, a bit shift, instead of 48. That saves work on every pixel while keeping the wide, three-row spread that smooths gradients and suppresses worm patterns.",
    ],
    use: {
      bestFor: [
        "photos and gradients where you want JJN-like smoothness, a little faster.",
      ],
      worksWith: [
        "1-bit output and small palettes like ",
        ...RETRO_PALETTES,
        ".",
      ],
      watchOut: [
        "it’s still slower than the two-row filters on very large images; ",
        algo("two-row-sierra"),
        " trades a little smoothness for speed.",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "sierra", look: "Natural, smooth, crisp" },
      {
        slug: "jarvis-judice-and-ninke-jjn",
        look: "Nearly identical, more work",
      },
      { slug: "two-row-sierra", look: "Two rows, slightly grainier" },
      { slug: "floyd-steinberg", look: "Sharper, more worms" },
    ],
    faq: [
      {
        question:
          "What’s the difference between Sierra, Two-Row Sierra and Sierra Lite?",
        answer: [
          "The same idea at three sizes: Sierra spreads the error over 10 neighbors on three rows, ",
          algo("two-row-sierra"),
          " over 7 on two rows and ",
          algo("sierra-lite"),
          " over just 3. Smaller filters are faster and grainier.",
        ],
      },
      colorFaq("Sierra"),
    ],
  },

  "two-row-sierra": {
    description:
      "Two-Row Sierra dithering spreads error over 7 neighbors on two rows: faster than Sierra, smoother than Floyd–Steinberg. See examples and try it free online.",
    intro:
      "Two-Row Sierra is the reduced version of the Sierra filter that Frankie Sierra published a year after it, in 1990. It drops the third row and spreads each pixel’s error over 7 neighbors on just two rows, so it runs faster while keeping most of the smoothness of the full filter.",
    method: [
      "Each pixel is rounded to the nearest available color and its error is split into 16ths: 4 and 3 go to the next two pixels on the row, and 1, 2, 3, 2, 1 to the five pixels below. All of the error is carried forward.",
      "It has the same footprint as Burkes, but its weights fall off more gently: the pixel two steps ahead gets 3/16 instead of Burkes’ 2/16, and the one straight below 3/16 instead of 4/16. The error spreads a little wider along the row, for a softer, more even texture.",
    ],
    use: {
      bestFor: [
        "a good middle ground between speed and smoothness on large images.",
      ],
      worksWith: [
        "1-bit output and retro palettes like the ",
        palette("gameboy", "Game Boy"),
        "’s four greens.",
      ],
      watchOut: [
        "slightly grainier gradients than the three-row ",
        algo("sierra"),
        ".",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "two-row-sierra", look: "Soft, even, fast" },
      { slug: "sierra", look: "Smoother, more work" },
      { slug: "sierra-lite", look: "Grainier, fastest" },
      { slug: "burkes", look: "Same footprint, crisper" },
    ],
    faq: [
      {
        question: "Two-Row Sierra or Burkes?",
        answer: [
          "Both reach the same 7 neighbors. ",
          algo("burkes"),
          " keeps more of the error close to the current pixel for a crisper look; Two-Row Sierra spreads it more evenly for a softer one.",
        ],
      },
      colorFaq("Two-Row Sierra"),
    ],
  },

  "sierra-lite": {
    description:
      "Sierra Lite is the smallest error-diffusion filter: 3 neighbors, weights 2-1-1 over 4. Fast, with a Floyd–Steinberg-like look. See how it works and try it free.",
    intro:
      "Sierra Lite, also known as Filter Lite, is the smallest filter in Frankie Sierra’s family and one of the cheapest error-diffusion algorithms there is. Each pixel’s error goes to just three neighbors, which makes it very fast while staying close to Floyd–Steinberg in look.",
    method: [
      "Each pixel is rounded to the nearest available color and its error is split into quarters: half goes to the next pixel on the row, and the other half is shared by two pixels on the row below. All of the error is carried forward.",
      "With so few neighbors the error doesn’t travel far, so the texture is a little coarser and more directional than Floyd–Steinberg’s, with more visible worms in flat areas. In exchange, it’s the fastest error diffusion in PixelSynth, and at small output sizes, where each dot is large anyway, the difference is hard to see.",
    ],
    use: {
      bestFor: ["quick previews, very large images and fast iteration."],
      worksWith: [
        "low-resolution pixel art, where each dot is big, like the ",
        { text: "pixel art preset", href: "/editor?preset=pixel-art" },
        ".",
      ],
      watchOut: [
        "more worms and directional streaks than larger filters such as ",
        algo("two-row-sierra"),
        ".",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "sierra-lite", look: "Fast, slightly coarse" },
      { slug: "floyd-steinberg", look: "Similar, a bit more even" },
      { slug: "two-row-sierra", look: "Smoother, 7 neighbors" },
      { slug: "atkinson", look: "More contrast, clipped extremes" },
    ],
    faq: [
      {
        question: "Is Sierra Lite as good as Floyd–Steinberg?",
        answer: [
          "Close. Both use a tiny footprint; ",
          algo("floyd-steinberg"),
          " spreads its error over 4 neighbors instead of 3, which gives a slightly more even texture. Sierra Lite is a little faster.",
        ],
      },
      colorFaq("Sierra Lite"),
    ],
  },

  atkinson: {
    description:
      "Atkinson dithering, the look of the original Macintosh: 6 neighbors and only 3/4 of the error kept, for crisp contrast. How it works, examples and a free tool.",
    intro:
      "Atkinson dithering was written by Bill Atkinson at Apple for the original Macintosh in 1984, and it gave MacPaint and early Mac software their signature look. It diffuses only three quarters of each pixel’s error, so highlights and shadows clip to clean white and black while midtones keep a crisp, stippled texture.",
    method: [
      "Each pixel is rounded to the nearest available color and 1/8 of its error goes to each of six neighbors: two to the right, three on the row below and one two rows down. That hands out 6/8 of the error; the remaining quarter is simply dropped. PixelSynth scans every row left to right.",
      "Dropping error means that near-black areas never build up enough brightness to place a white dot, and near-white areas never collect enough darkness for a black one. Small errors vanish instead of spreading, so the image gains contrast and clean flat areas, at the cost of detail in deep shadows and bright highlights.",
    ],
    use: {
      bestFor: [
        "high-contrast images, line art, screenshots, well-lit faces and a retro Mac look.",
      ],
      worksWith: ["1-bit output, laser engraving and small palettes."],
      watchOut: [
        "lost detail in shadows and highlights; dark photos can turn solid black, so brighten them or raise the gamma first.",
      ],
      animation: DIFFUSION_FLICKER,
    },
    compare: [
      { slug: "atkinson", look: "Crisp, high contrast, clipped extremes" },
      { slug: "floyd-steinberg", look: "Full tonal range, softer" },
      { slug: "bayer-4-4", look: "Regular grid, retro game look" },
      { slug: "stucki", look: "Smooth and detailed" },
    ],
    faq: [
      {
        question: "Why is Atkinson dithering called the Mac look?",
        answer: [
          "Bill Atkinson wrote it for the original 1984 Macintosh, whose screen could show only black and white. MacPaint, HyperCard and countless early Mac images were dithered with it, so its crisp stipple became the look of the era.",
        ],
      },
      {
        question: "Is Atkinson good for laser engraving?",
        answer: [
          "Yes. Its clean, separated dots and solid blacks and whites engrave well. Stay in 1-bit, set the output width your engraver needs and save the PNG at ×1.",
        ],
      },
    ],
  },

  "bayer-2-2": {
    description:
      "Bayer 2×2 ordered dithering: the smallest threshold matrix, 5 gray levels and bold pixel patterns. How it works, examples and a free online dithering tool.",
    intro:
      "Bayer 2×2 is the smallest ordered dithering matrix, from the method Bryce Bayer published at Kodak in 1973. It compares each pixel with one of just four thresholds, so it can show only five gray levels, each as a bold, regular pattern. The result is chunky and graphic, closer to a textile or a pixel-art tile than to a photo.",
    method: [
      "A 2×2 matrix of thresholds is tiled across the image. Each pixel is compared with the threshold at its position in the tile: brighter pixels turn white, darker ones black. Nothing is carried between pixels, so every pixel can be computed on its own, in any order.",
      "The four ranks are placed so that each new level lights the pixel farthest from those already lit: a light gray lights one pixel per cell, 50% gives a perfect checkerboard, and the next level leaves just one pixel dark. With so few levels, gradients break into visible bands.",
    ],
    use: {
      bestFor: ["bold graphic looks, small icons and tiny pixel art."],
      worksWith: [
        "palettes where a checkerboard reads as a mix of two colors, like ",
        palette("cga-cyan-magenta", "CGA"),
        " or ",
        palette("zx-spectrum", "ZX Spectrum"),
        ".",
      ],
      watchOut: [
        "only five levels between each pair of colors, so gradients band; ",
        algo("bayer-4-4"),
        " gives 17.",
      ],
      animation: [ORDERED_STABLE],
    },
    compare: [
      { slug: "bayer-2-2", look: "Bold, 5 levels, banding" },
      { slug: "bayer-4-4", look: "17 levels, classic retro" },
      { slug: "bayer-8-8", look: "65 levels, smooth" },
      { slug: "floyd-steinberg", look: "Organic, detailed" },
    ],
    faq: [
      {
        question: "Is Bayer dithering good for animated GIFs?",
        answer: [
          "Yes. Each pixel’s threshold depends only on its position, so still areas stay identical from frame to frame, and regular patterns also compress well in GIF files.",
        ],
      },
      {
        question: "Bayer 2×2, 4×4 or 8×8?",
        answer: [
          "The bigger the matrix, the more gray levels and the finer the pattern: 5 for 2×2, 17 for ",
          algo("bayer-4-4", "4×4"),
          ", 65 for ",
          algo("bayer-8-8", "8×8"),
          ". Pick 2×2 when you want the pattern itself to be the look.",
        ],
      },
    ],
  },

  "bayer-4-4": {
    description:
      "Bayer 4×4 ordered dithering: 17 gray levels in a regular cross-hatch, the texture of retro games and early computers. How it works, examples and a free tool.",
    intro:
      "Bayer 4×4 is the classic ordered dither: a 4×4 threshold matrix, from Bryce Bayer’s 1973 method, tiled across the image. It renders 17 gray levels as a regular cross-hatch, the texture of early computer graphics and retro games, and it’s fast, predictable and perfectly stable in animation.",
    method: [
      "The 4×4 matrix holds the ranks 0 to 15, built by nesting the 2×2 pattern inside itself. Each pixel is compared with the threshold at its position in the tile: brighter pixels turn white, darker ones black. Nothing is carried between pixels.",
      "Because each level lights the pixel farthest from those already lit, every gray is spread as evenly as the grid allows, which produces the characteristic cross-hatch. Sixteen thresholds give 17 levels: enough for gradients that look smooth from a distance, few enough that the pattern stays part of the look.",
    ],
    use: {
      bestFor: [
        "retro game and demoscene looks, UI graphics and animated GIFs.",
      ],
      worksWith: ["small palettes like ", ...RETRO_PALETTES, "."],
      watchOut: [
        "the grid is visible on photos, and it can beat into moiré when the result is resized by a fraction instead of a whole multiple.",
      ],
      animation: [
        ORDERED_STABLE,
        " The animated sample on the home page uses Bayer 4×4 with PICO-8.",
      ],
    },
    compare: [
      { slug: "bayer-4-4", look: "Classic cross-hatch, stable" },
      { slug: "bayer-2-2", look: "Chunkier, 5 levels" },
      { slug: "bayer-8-8", look: "Finer, 65 levels" },
      { slug: "blue-noise", look: "No grid, fine grain, also stable" },
    ],
    faq: [
      {
        question: "Why is Bayer dithering used for games and GIFs?",
        answer: [
          "It’s cheap, every pixel can be computed independently, and the pattern is fixed to the pixel grid, so moving sprites and animated frames don’t shimmer. The regular texture also compresses well.",
        ],
      },
      {
        question: "Why does my dithered image show moiré when resized?",
        answer: [
          "The pattern repeats every 4 pixels, so scaling by a fraction makes it beat against the new pixel grid. PixelSynth enlarges the view and the export nearest-neighbor by whole multiples, which keeps it crisp; resize by whole multiples elsewhere too.",
        ],
      },
    ],
  },

  "bayer-8-8": {
    description:
      "Bayer 8×8 ordered dithering: 65 gray levels, smooth gradients and a fine regular pattern that stays stable in animation. How it works, and a free online tool.",
    intro:
      "Bayer 8×8 is the largest Bayer matrix in PixelSynth: 64 thresholds tiled every 8 pixels, from Bryce Bayer’s 1973 method. It renders 65 gray levels, so gradients look smooth while keeping the tidy, regular texture of ordered dithering, and it stays perfectly stable from frame to frame.",
    method: [
      "The 8×8 matrix holds the ranks 0 to 63, built by nesting the 2×2 pattern inside itself three times. Each pixel is compared with the threshold at its position in the tile: brighter pixels turn white, darker ones black. Nothing is carried between pixels.",
      "Every level lights the pixel farthest from those already lit, so dots are spread as evenly as the grid allows. With 64 thresholds the steps between levels are small enough for smooth gradients, and the cross-hatch is fine enough to recede on most images.",
    ],
    use: {
      bestFor: [
        "smooth gradients with an ordered look, animations, and large images where speed matters.",
      ],
      worksWith: [
        "1-bit, ",
        palette("grayscale-4", "Grayscale 4"),
        " and any retro palette.",
      ],
      watchOut: [
        "the cross-hatch still shows in flat midtones, and photos look more mechanical than with error diffusion.",
      ],
      animation: [ORDERED_STABLE],
    },
    compare: [
      { slug: "bayer-8-8", look: "Fine cross-hatch, 65 levels" },
      { slug: "bayer-4-4", look: "Coarser, 17 levels" },
      { slug: "blue-noise", look: "Grain instead of grid" },
      { slug: "floyd-steinberg", look: "Organic, flickers in animation" },
    ],
    faq: [
      {
        question: "Why not use an even bigger Bayer matrix?",
        answer: [
          "Past 64 thresholds the gain in smoothness is small, while the pattern becomes a larger tile. For a fine texture without any grid, try ",
          algo("blue-noise"),
          ", which uses a 64×64 mask with no regular structure.",
        ],
      },
      colorFaq("Bayer 8×8"),
    ],
  },

  "clustered-dot-halftone-ordered": {
    description:
      "Clustered-dot ordered dithering groups pixels into growing dots, like a printed halftone. How it works, examples, comparison and a free online tool.",
    intro:
      "Clustered-dot dithering is an ordered dither whose threshold matrix grows dots from the center of each cell instead of scattering them. Tiled every 4 pixels, it mimics the halftone dots of offset printing, and it’s how many laser printers rendered gray in the 1980s: clustered dots survive toner and ink much better than isolated pixels.",
    method: [
      "A 4×4 matrix of ranks 0 to 15 is tiled across the image, and each pixel is compared with the threshold at its position. Unlike Bayer, whose ranks jump across the cell, here consecutive ranks sit next to each other, so as the tone changes a single dot grows or shrinks in each cell, one pixel at a time.",
      "That gives 17 levels, like Bayer 4×4, but at a lower effective resolution: each 4×4 cell holds one dot, so detail finer than the cell is lost. What you get in return is the solid, printed look of a halftone screen, and dots that hold up on paper.",
    ],
    use: {
      bestFor: [
        "newspaper, comic and print-inspired looks, and printing on paper.",
      ],
      worksWith: [
        palette("newsprint", "Newsprint"),
        " and ",
        palette("riso", "Riso"),
        " palettes.",
      ],
      watchOut: [
        "less detail than dispersed dithers; for an angled screen with adjustable size and dot shape, use ",
        algo("halftone"),
        ".",
      ],
      animation: [ORDERED_STABLE],
    },
    compare: [
      {
        slug: "clustered-dot-halftone-ordered",
        look: "Dots on a fixed grid, print look",
      },
      { slug: "halftone", look: "Angled screen, adjustable size" },
      { slug: "bayer-4-4", look: "Dispersed dots, more detail" },
      { slug: "floyd-steinberg", look: "Organic, most detail" },
    ],
    faq: [
      {
        question: "Clustered or dispersed dots?",
        answer: [
          "Dispersed dithers like ",
          algo("bayer-4-4", "Bayer"),
          " scatter single pixels for the most detail on screens. Clustered dots group them, which reads as a print and reproduces far better on paper, where lone pixels smear or vanish.",
        ],
      },
      colorFaq("Clustered Dot"),
    ],
  },

  "blue-noise": {
    description:
      "Blue noise dithering spreads dots evenly with no visible grid, for a fine natural grain that stays stable in animation. How it works and a free online tool.",
    intro:
      "Blue noise dithering compares each pixel with a threshold mask whose values are spread as evenly as possible, with no repeating structure for the eye to pick out. The idea comes from Robert Ulichney’s work on digital halftoning, and the mask is built with his void-and-cluster method from 1993. It gives a fine, natural grain, with the speed and frame-to-frame stability of ordered dithering.",
    method: [
      "PixelSynth tiles a 64×64 threshold mask, 4,096 ranks, across the image. Each pixel turns white when its brightness exceeds the threshold at its position, exactly as with Bayer, and nothing is carried between pixels. What differs is the mask: its ranks are arranged so that at every gray level the lit pixels are spread evenly, with no clumps and no lattice.",
      "“Blue” describes the noise spectrum: its energy sits at high frequencies, the fine detail the eye blends most easily, with almost none at the low frequencies where noise reads as blotches. At 64 pixels, the tile is large enough that its repetition is practically invisible.",
    ],
    use: {
      bestFor: [
        "photos and gradients that should look natural, and animation.",
      ],
      worksWith: ["every palette, from 1-bit to ", ...RETRO_PALETTES, "."],
      watchOut: [
        "slightly less edge detail than error diffusion, since the mask doesn’t adapt to the image.",
      ],
      animation: [ORDERED_STABLE, " The grain stays put, like a film grain."],
    },
    compare: [
      { slug: "blue-noise", look: "Fine even grain, no grid" },
      { slug: "bayer-8-8", look: "Visible cross-hatch" },
      { slug: "floyd-steinberg", look: "Sharper, flickers in animation" },
      { slug: "random-dither", look: "Clumpy white noise" },
    ],
    faq: [
      {
        question: "Blue noise or Floyd–Steinberg?",
        answer: [
          algo("floyd-steinberg"),
          " keeps a little more detail in stills. Blue noise is steadier: its dots don’t shimmer in animations, and it has no worm patterns.",
        ],
      },
      {
        question:
          "What’s the difference between Blue Noise and Void-and-Cluster?",
        answer: [
          "Both masks are built with the void-and-cluster method. Blue Noise uses a large 64×64 mask, so no repetition shows; ",
          algo("void-and-cluster"),
          " uses the classic 16×16 array, whose faint period gives a more organic, slightly structured texture.",
        ],
      },
    ],
  },

  "random-dither": {
    description:
      "Random dithering compares each pixel with a random threshold for a coarse, grainy texture. How it works, why it looks noisy, examples and a free online tool.",
    intro:
      "Random dithering is the simplest way to break up banding: each pixel is compared with a random threshold instead of a fixed one. It’s the oldest idea in dithering, and it gives a coarse, grainy, photographic texture with no pattern at all.",
    method: [
      "For every pixel a random number between 0 and 255 is drawn, and the pixel turns white if its brightness is higher. On average a 30% gray lights 30% of the pixels, so tones come out right, but the dots fall wherever chance puts them: some clump together and some areas are left bare.",
      "That’s white noise, with energy at every frequency, including the low ones the eye sees as blotches, which is why random dither looks noisier than blue noise at the same density. PixelSynth seeds the generator, so the grain stays in place while you adjust other settings and in every frame of an animation.",
    ],
    use: {
      bestFor: ["gritty film-grain, photocopy and glitch textures."],
      worksWith: [
        "1-bit, ",
        palette("sepia", "Sepia"),
        " and ",
        palette("cyanotype", "Cyanotype"),
        ".",
      ],
      watchOut: [
        "the least detail of any algorithm, and blotchy areas; for a fine grain, pick ",
        algo("blue-noise"),
        ".",
      ],
      animation: [
        "Stable. The random thresholds are seeded, so each pixel keeps the same one in every frame.",
      ],
    },
    compare: [
      { slug: "random-dither", look: "Coarse, clumpy grain" },
      { slug: "blue-noise", look: "Even, fine grain" },
      { slug: "void-and-cluster", look: "Organic, balanced" },
      { slug: "floyd-steinberg", look: "Detailed, sharp" },
    ],
    faq: [
      {
        question: "Why does random dithering look so noisy?",
        answer: [
          "Random thresholds let dots clump and leave gaps, which the eye sees as blotches. ",
          algo("blue-noise"),
          " spreads the same number of dots evenly, so it looks much finer.",
        ],
      },
      {
        question: "When is random dithering useful?",
        answer: [
          "When you want grit rather than precision: a photocopied zine, a lo-fi poster or a noisy texture to layer over other artwork with a transparent background.",
        ],
      },
    ],
  },

  "void-and-cluster": {
    description:
      "Void-and-cluster dithering, Robert Ulichney’s 1993 method: a balanced 16×16 mask of dots and voids for a smooth, organic texture. How it works and a free tool.",
    intro:
      "Void-and-cluster is Robert Ulichney’s 1993 method for building ordered dither arrays with blue-noise properties. It repeatedly finds the tightest cluster of dots and the largest void between them, and uses them to rank every position in the array. PixelSynth uses a classic 16×16 array, which gives a smooth, organic texture with a faint repeating rhythm.",
    method: [
      "Building the array starts from a few random dots, which are relaxed by moving the dot in the tightest cluster into the largest void until nothing changes. Then every position is ranked: removing dots from the tightest clusters numbers the ranks below, and filling the largest voids numbers the ranks above. Clusters and voids are measured with a Gaussian blur on a grid that wraps around, so the tile has no seams.",
      "Dithering with it works like Bayer: the 16×16 array of 256 ranks is tiled across the image, and each pixel turns white when its brightness exceeds the threshold at its position. That gives 257 levels, with dots dispersed evenly and none of Bayer’s cross-hatch.",
    ],
    use: {
      bestFor: [
        "a smooth, organic texture that is still ordered, and animation.",
      ],
      worksWith: ["any palette, and 1-bit with tone mapping."],
      watchOut: [
        "the 16-pixel period can show faintly in large flat areas; ",
        algo("blue-noise"),
        " uses a 64×64 mask to hide it.",
      ],
      animation: [ORDERED_STABLE],
    },
    compare: [
      { slug: "void-and-cluster", look: "Organic, faint 16 px rhythm" },
      { slug: "blue-noise", look: "Same method, no visible repeat" },
      { slug: "bayer-8-8", look: "Regular cross-hatch" },
      { slug: "random-dither", look: "Unbalanced, clumpy grain" },
    ],
    faq: [
      {
        question: "What does void-and-cluster mean?",
        answer: [
          "A “cluster” is where dots are packed tightest, a “void” where the biggest gap is. The method ranks positions by repeatedly removing dots from clusters and filling voids, so every gray level is as evenly spread as possible.",
        ],
      },
      {
        question: "Void-and-Cluster or Blue Noise?",
        answer: [
          "They come from the same method. ",
          algo("blue-noise"),
          " uses a larger mask for a grain with no visible repetition; Void-and-Cluster’s smaller array has a slight rhythm that some images benefit from.",
        ],
      },
    ],
  },

  halftone: {
    description:
      "Halftone dithering: round, square or diamond dots on an angled screen, like newsprint and comics. Set the screen size and angle and try it free in your browser.",
    intro:
      "Halftone turns an image into a grid of dots that grow in the shadows and shrink in the highlights, the way newspapers, magazines and comics have printed photographs since the late 19th century; Frederic Ives patented an early halftone process in the 1880s. In PixelSynth you choose the screen size, the angle and the dot shape: round, square or diamond.",
    method: [
      "The image is covered by a grid of cells, turned to the screen angle (45° by default, the classic angle for black ink, where rows of dots are least noticeable). Each cell holds one dot. Every pixel is ranked by how close it is to its cell’s center (measured to suit the dot shape), and it is inked when the image there is darker than its threshold, so the dot grows from the center as the tone darkens.",
      "Ranking pixels as they actually fall on the rotated grid keeps every gray level exact. In CMYK mode each ink gets its own screen at the classic angles, cyan 15°, magenta 75°, yellow 0° and black 45°, which overprint into small rosettes instead of moiré.",
    ],
    use: {
      bestFor: [
        "newsprint, pop-art, comic and poster looks, screen printing and risograph.",
      ],
      worksWith: [
        palette("newsprint", "Newsprint"),
        " and ",
        palette("riso", "Riso"),
        " palettes, CMYK mode, and a transparent background to lay the dots over other artwork.",
      ],
      watchOut: [
        "small images leave few cells: a 400 px image with an 8 px screen is only about 50 dots across. Use a larger image or a smaller screen for more detail.",
      ],
      animation: [
        "Stable. The screen is fixed, so only the dots under moving areas change.",
      ],
    },
    compare: [
      { slug: "halftone", look: "Angled dots, adjustable screen" },
      {
        slug: "clustered-dot-halftone-ordered",
        look: "Fixed 4×4 grid, no angle",
      },
      { slug: "line-screen", look: "Lines instead of dots" },
      { slug: "floyd-steinberg", look: "Scattered pixels, most detail" },
    ],
    faq: [
      {
        question: "How do I make a halftone effect from a photo?",
        answer: [
          "Open the editor with Halftone selected, drop in your photo, then set the screen size (larger means bigger dots), the angle and the dot shape. Raise the contrast a little for punchier dots and export a PNG.",
        ],
      },
      {
        question: "What screen angle should I use?",
        answer: [
          "45° is the classic choice: the eye is least sensitive to diagonal rows, so the screen recedes. 0° or 90° makes the grid a deliberate part of the look.",
        ],
      },
      {
        question: "Can I make CMYK halftones?",
        answer: [
          "Yes. Switch the color mode to CMYK: cyan, magenta, yellow and black are each screened at their classic angle and overprinted on white, like a four-color print.",
        ],
      },
    ],
  },

  "line-screen": {
    description:
      "Line screen dithering draws parallel lines whose thickness follows the tone, like an engraving or a banknote. Set spacing, angle and wave, free in your browser.",
    intro:
      "Line screen renders an image as parallel lines that thicken in the shadows and thin out in the highlights, like a copperplate engraving, a banknote portrait or an old scientific illustration. Set the line spacing and angle, let the bright areas lift the lines like an oscilloscope trace, or make them wave.",
    method: [
      "The image is crossed by parallel lines, a set spacing apart and turned to the screen angle. Every pixel is ranked by its distance to the middle of its line, and it is inked when the image there is darker than its threshold, so each line widens from its middle, one row of pixels at a time, as the tone darkens.",
      "Two options bend the lines. Displacement pushes them sideways where the image is bright, up to four line spacings, which draws the picture as a relief of ridges. Wave ripples them along their length, with an adjustable amplitude and wavelength.",
    ],
    use: {
      bestFor: [
        "engraving and banknote looks, posters, and ridgeline-style portraits.",
      ],
      worksWith: [
        "1-bit, ",
        palette("sepia", "Sepia"),
        " and ",
        palette("cyanotype", "Cyanotype"),
        ".",
      ],
      watchOut: [
        "the line spacing in pixels limits how many thicknesses a line can take, so very tight spacings flatten the tones; keep it wider on small images.",
      ],
      animation: [
        "Stable without displacement: the lines stay put and only thicken where the image changes.",
      ],
    },
    compare: [
      { slug: "line-screen", look: "Engraved lines, adjustable" },
      { slug: "halftone", look: "Dots instead of lines" },
      {
        slug: "clustered-dot-halftone-ordered",
        look: "Small dots on a fixed grid",
      },
      { slug: "floyd-steinberg", look: "Scattered pixels, most detail" },
    ],
    faq: [
      {
        question: "How do I make an engraving effect from a photo?",
        answer: [
          "Open the editor with Line Screen selected, drop in your photo and set the line spacing and angle. A little extra contrast and sharpening make the lines read like a burin cut.",
        ],
      },
      {
        question: "What does displacement do?",
        answer: [
          "It pushes each line sideways where the image is bright, so the lines trace the picture like a row of ridges or an oscilloscope. Combine it with a black background and light lines for the classic look.",
        ],
      },
      {
        question: "Can I export line screens as vectors?",
        answer: [
          "No, PixelSynth exports PNG and GIF. For pen plotters or cutters, trace the PNG in a vector editor; at ×4 or ×8 export the lines are crisp enough to trace cleanly.",
        ],
      },
    ],
  },
};

export function getGuide(algorithm: Algorithm): AlgorithmGuide {
  return ALGORITHM_GUIDES[algorithm.slug];
}

/** Page title, before the site name: "Atkinson Dithering: How It Works". */
export function guideTitle(algorithm: Algorithm) {
  return `${ditheringName({ name: algorithm.shortName })} Dithering: How It Works`;
}
