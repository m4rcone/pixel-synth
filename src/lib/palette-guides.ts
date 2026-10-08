/**
 * Long-form pages for the best-known palettes (/palettes/<slug>). Colors come
 * from the presets in palettes.ts; this holds the prose, the color names and
 * which presets each page covers. Keep the facts sourced: the hardware notes
 * follow each system's reference (Pan Docs, NESdev, the PICO-8 manual, IBM's
 * CGA/EGA documentation and TI's TMS9918 datasheet as summarized on
 * Wikipedia); the print pages follow the history of each process.
 */

import type { AlgorithmId } from "@/lib/algorithms";
import type { FaqEntry, FaqPart } from "@/lib/faq";
import { PIXEL_ART_LINK } from "@/lib/editor/pixel-art";
import { hexToRgb } from "@/lib/editor/pixels";
import { getPalettePreset, type PalettePreset } from "@/lib/palettes";

export type PaletteGuide = {
  /** URL segment: /palettes/<slug>. Public once shipped; never change it. */
  slug: string;
  /** Display name: "Game Boy", used as "<name> Palette". */
  name: string;
  /** Meta description, at most 160 characters. */
  description: string;
  intro: string;
  /** `label` names the hardware row: "Process" for print palettes. */
  facts: { year: string; hardware: string; label?: "Hardware" | "Process" };
  /** Presets shown, the first one being the page's own. */
  palettes: {
    id: string;
    /** Heading of its color table, when a page shows several. */
    heading?: string;
    /** Name of every color, in preset order (none for the NES). */
    names?: readonly string[];
  }[];
  /** Note under the color table: where the values come from. */
  accuracy: string;
  sections: { heading: string; paragraphs: FaqPart[][] }[];
  /** "How to" steps. */
  steps: FaqPart[][];
  /** Algorithms shown in the examples, with this palette. */
  examples: AlgorithmId[];
  related: string[];
  faq: FaqEntry[];
  /** Last meaningful update (YYYY-MM-DD), when newer than the site's. */
  updated?: string;
};

const algo = (slug: AlgorithmId, text: string): FaqPart => ({
  text,
  href: `/algorithms/${slug}`,
});

const PIXEL_ART_PRESET: FaqPart = {
  text: "pixel art preset",
  href: PIXEL_ART_LINK,
};

/** Hex codes of a preset as prose: "#0F380F, #306230 and #9BBC0F". */
function hexList(id: string) {
  const colors = getPalettePreset(id)!.colors.map((c) => c.toUpperCase());
  return `${colors.slice(0, -1).join(", ")} and ${colors.at(-1)}`;
}

const RGBI_NAMES = [
  "Black",
  "Blue",
  "Green",
  "Cyan",
  "Red",
  "Magenta",
  "Brown",
  "Light gray",
  "Dark gray",
  "Light blue",
  "Light green",
  "Light cyan",
  "Light red",
  "Light magenta",
  "Yellow",
  "White",
] as const;

const SHADES = [
  "Darkest (shade 3)",
  "Dark (shade 2)",
  "Light (shade 1)",
  "Lightest (shade 0)",
] as const;

export const PALETTE_GUIDES: PaletteGuide[] = [
  {
    slug: "game-boy",
    name: "Game Boy",
    description:
      "The 4 green shades of the original Game Boy with hex and RGB codes, the Game Boy Pocket grays, and a free tool to turn any image into Game Boy art.",
    intro: `The original Game Boy shows every image in just four shades of green. The hex codes ${hexList("gameboy")} are a widely used approximation of its screen, and a staple of pixel art. Below are all four with RGB values, the grays of the Game Boy Pocket, and a free way to turn any photo into Game Boy art in your browser.`,
    facts: { year: "1989", hardware: "Nintendo DMG-01, 160 × 144 LCD" },
    palettes: [
      { id: "gameboy", heading: "Game Boy (1989)", names: SHADES },
      {
        id: "gameboy-pocket",
        heading: "Game Boy Pocket (1996)",
        names: SHADES,
      },
    ],
    accuracy:
      "The Game Boy has no RGB palette: its screen shows four levels of darkness and the green is the LCD’s own tint. These values, the common version (Lospec’s “Original Gameboy”), approximate how the original screen looks; others exist, like the darker, bluer #294139 to #7B8210 on Wikipedia. The Pocket shades follow Wikipedia’s list of console palettes.",
    sections: [
      {
        heading: "Where the Game Boy greens come from",
        paragraphs: [
          [
            "Nintendo released the Game Boy in Japan on April 21, 1989, and in North America that July. Nintendo Research & Development 1, under Gunpei Yokoi and Satoru Okada, paired an inexpensive reflective STN LCD with four AA batteries, and the screen’s greenish tint became as recognizable as the games themselves. Together with the Game Boy Color, it sold an estimated 118.69 million units.",
          ],
          [
            "The screen can’t show color at all. Each of its 160 × 144 pixels is one of four levels of darkness, and the green comes from the LCD. The Game Boy Pocket of 1996 switched to an FSTN screen with a true black-and-white look, which is why its shades are much grayer, with only an olive hint.",
          ],
        ],
      },
      {
        heading: "How the Game Boy draws four shades",
        paragraphs: [
          [
            "Graphics are built from 8 × 8 tiles with 2 bits per pixel, so each pixel holds a number from 0 to 3. A palette register maps those numbers to the four shades: the background has one (BGP), and sprites have two (OBP0 and OBP1), in which number 0 is transparent. Games rewrite these registers to fade the screen in and out, or to flash an enemy when it’s hit.",
          ],
          [
            "Because the screen shows only brightness, an image should be converted to Game Boy colors by brightness, not by hue: a blue sky has no “nearest” green. PixelSynth matches this palette by brightness, sorting the four greens from dark to light and dithering the image’s luminance along them.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Game Boy palette selected and drop in your image.",
      ],
      [
        "Set Output size to 160 pixels, the Game Boy’s own resolution, or apply the ",
        PIXEL_ART_PRESET,
        " and switch its palette to Game Boy.",
      ],
      [
        "Pick an algorithm: ",
        algo("bayer-4-4", "Bayer 4×4"),
        " gives an even, tile-like pattern, ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " keeps the most detail in photos.",
      ],
      [
        "Raise the contrast a little so the image uses all four shades, and save the PNG at ×4 or ×8 to keep every pixel crisp.",
      ],
    ],
    examples: ["floyd-steinberg", "bayer-4-4", "atkinson", "blue-noise"],
    related: ["pico-8", "nes", "zx-spectrum"],
    faq: [
      {
        question: "Did the Game Boy have an official color palette?",
        answer: [
          "No. The LCD shows four levels of darkness and its green tint comes from the screen, so every RGB version, including this one, is an approximation.",
        ],
      },
      {
        question: "Is this the Game Boy Color palette?",
        answer: [
          "No. The Game Boy Color (1998) picked its colors from 32,768 and could show up to 56 at once. These four greens belong to the original Game Boy.",
        ],
      },
    ],
  },

  {
    slug: "pico-8",
    name: "PICO-8",
    description:
      "All 16 PICO-8 colors with official names, hex and RGB codes, how the fantasy console uses them, and a free tool to dither any image to the PICO-8 palette.",
    intro:
      "PICO-8 is a fantasy console: a virtual 8-bit machine with a 128 × 128 screen and a fixed palette of 16 colors. Made by Lexaloffle Games and released in 2015, it turned that palette into one of the most recognizable in indie pixel art, used far beyond PICO-8 itself. Here are all 16 colors with their official names, hex and RGB values, and a free way to dither any image to them.",
    facts: { year: "2015", hardware: "Lexaloffle PICO-8, 128 × 128" },
    palettes: [
      {
        id: "pico8",
        names: [
          "Black",
          "Dark blue",
          "Dark purple",
          "Dark green",
          "Brown",
          "Dark gray",
          "Light gray",
          "White",
          "Red",
          "Orange",
          "Yellow",
          "Green",
          "Blue",
          "Indigo",
          "Pink",
          "Peach",
        ],
      },
    ],
    accuracy:
      "PICO-8 is software, so these are its exact colors, listed in its own order, colors 0 to 15; the names are the ones in the PICO-8 manual.",
    sections: [
      {
        heading: "A palette made for small games",
        paragraphs: [
          [
            "Joseph White, known as zep, designed PICO-8 around deliberate limits: a 128 × 128 display, 16 colors, four-channel sound, and cartridges of 32 KB saved as PNG images with the code, graphics and music inside. The limits are the point: small games that get finished, shared on the PICO-8 forum. Celeste began there, as Celeste Classic, made in four days for a game jam.",
          ],
          [
            "zep designed the palette for PICO-8 itself, trying many variations before settling on these 16. It holds cool and warm ramps, strong primaries for characters and pickups, and skin tones in pink and peach, so one palette can draw a forest, a dungeon or a face. That range is why artists use it for illustrations and in other engines too.",
          ],
        ],
      },
      {
        heading: "How PICO-8 uses its colors",
        paragraphs: [
          [
            "Each color has a number from 0 to 15, shown in the table. Programs remap them with pal() to fade, flash or recolor sprites, and choose which are transparent with palt(). The screen always shows 16 colors at once.",
          ],
          [
            "PICO-8 also has 16 hidden colors, numbered 128 to 143, that a cart can put on screen by remapping the display palette. They aren’t in the manual, though zep allows their use. PixelSynth’s preset sticks to the standard 16; add hidden ones through a ",
            { text: "Custom palette", href: "/palettes#palette-custom" },
            " if you need them.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with PICO-8 selected. It matches by color, picking the nearest of the 16 for every pixel.",
      ],
      [
        "For the PICO-8 look in one click, apply the ",
        PIXEL_ART_PRESET,
        ": it shrinks the image to about 128 × 96 pixels’ worth of detail and uses PICO-8 with a 2×2 Bayer pattern.",
      ],
      [
        "For a real cart screen, crop the image square first and set Output size to 128 pixels.",
      ],
      [
        "Save at ×4 or ×8 to share. At ×1 and 128 × 128, the PNG is ready for PICO-8’s import command, which loads it onto the sprite sheet.",
      ],
    ],
    examples: ["bayer-2-2", "bayer-4-4", "floyd-steinberg", "blue-noise"],
    related: ["game-boy", "nes", "commodore-64"],
    faq: [
      {
        question: "Does PixelSynth include PICO-8’s secret palette?",
        answer: [
          "No, the preset has the 16 standard colors. To use the hidden ones, build a ",
          { text: "Custom palette", href: "/palettes#palette-custom" },
          " and add their hex codes.",
        ],
      },
      {
        question: "Why does my PICO-8 image look noisy?",
        answer: [
          "At full resolution, 16 colors dither into fine noise. Shrink the image first, with Output size or the ",
          PIXEL_ART_PRESET,
          ", so each pixel becomes a visible block, and prefer an ordered pattern like ",
          algo("bayer-2-2", "Bayer 2×2"),
          ".",
        ],
      },
    ],
  },

  {
    slug: "nes",
    name: "NES",
    description:
      "The 54 colors of the NES palette with hex codes, why no NES palette is official, how the console showed 25 colors at once, and a free NES dithering tool.",
    intro:
      "The Nintendo Entertainment System can show 54 different colors, but it never made them as RGB: its picture chip generated a TV signal directly, so every NES palette you’ll find, including this one, is an approximation. Here are all 54 with hex codes, how the NES used them, at most 25 on screen, and a free way to dither any image to NES colors.",
    facts: { year: "1983", hardware: "Ricoh 2C02 PPU" },
    palettes: [{ id: "nes" }],
    accuracy:
      "The NES has no official RGB palette. These values follow the NTSC approximation in Wikipedia’s list of video game console palettes; emulators ship others, measured from hardware or tuned by eye.",
    sections: [
      {
        heading: "Why every NES palette is an approximation",
        paragraphs: [
          [
            "Nintendo released the Famicom in Japan in 1983 and the NES in North America in 1985. Its picture processing unit, the Ricoh 2C02, doesn’t store colors as red, green and blue: each of its 64 palette entries is a hue and a brightness level that the chip turns straight into a composite video signal. Several entries repeat, like the blacks, which leaves about 54 distinct colors.",
          ],
          [
            "Because each TV decoded that signal its own way, the same game looked different from one set to the next, and there is no “correct” RGB version. That’s why emulators disagree, and why NES palettes online differ in their blues and greens.",
          ],
        ],
      },
      {
        heading: "How many colors could the NES show at once?",
        paragraphs: [
          [
            "Palette memory holds 8 palettes of 4 entries: 4 for the background and 4 for sprites. The background palettes share one backdrop color, and the first entry of each sprite palette is transparent, so a screen holds at most 25 colors: 13 for the background and 12 for sprites.",
          ],
          [
            "Each 16 × 16 area of the background uses one palette, and each 8 × 8 or 8 × 16 sprite uses one. Artists worked around this by layering sprites and planning scenes in 16-pixel blocks. PixelSynth doesn’t apply these limits: it dithers with all 54 colors freely, which gives an NES style rather than a screen the console could draw.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the NES palette selected. It matches by color, picking the nearest of the 54.",
      ],
      [
        "Shrink the image toward the NES resolution, 256 × 240, with Output size, or apply the ",
        PIXEL_ART_PRESET,
        " and switch its palette to NES.",
      ],
      [
        "Use an ordered dither like ",
        algo("bayer-4-4", "Bayer 4×4"),
        " for the tidy pattern of 8-bit art, or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " to keep a photo’s detail.",
      ],
      ["Export at ×4 so every pixel stays a crisp block."],
    ],
    examples: ["bayer-4-4", "bayer-2-2", "floyd-steinberg", "atkinson"],
    related: ["game-boy", "pico-8", "commodore-64"],
    faq: [
      {
        question: "How many colors are in the NES palette?",
        answer: [
          "64 entries, of which about 54 are distinct; the rest repeat black or gray. A single screen shows at most 25 of them.",
        ],
      },
      {
        question: "Can I make images that run on a real NES?",
        answer: [
          "Not directly. PixelSynth uses all 54 colors anywhere in the image, while the NES allows 4 per 16 × 16 background area and 25 per screen. The result is NES-style art, not a ready-to-use background.",
        ],
      },
    ],
  },

  {
    slug: "commodore-64",
    name: "Commodore 64",
    description:
      "All 16 Commodore 64 colors with names and hex codes in the Pepto calibration, how the VIC-II graphics modes limited them, and a free C64 dithering tool.",
    intro:
      "The Commodore 64 has 16 fixed colors from its VIC-II video chip, and they are among the most distinctive of the 8-bit era: muted, earthy and pastel rather than bright. Here are all 16 with their names and hex codes in the Pepto calibration widely used by emulators, how the C64’s graphics modes limited them, and a free way to dither any image to them.",
    facts: { year: "1982", hardware: "MOS Technology VIC-II" },
    palettes: [
      {
        id: "c64",
        names: [
          "Black",
          "White",
          "Red",
          "Cyan",
          "Purple",
          "Green",
          "Blue",
          "Yellow",
          "Orange",
          "Brown",
          "Light red",
          "Dark gray",
          "Gray",
          "Light green",
          "Light blue",
          "Light gray",
        ],
      },
    ],
    accuracy:
      "The VIC-II made its colors as a video signal, so there are no official RGB values. These are Philip “Pepto” Timmermann’s measured Pepto palette, widely adopted by emulators; his later Colodore model refines it. They are listed in the C64’s own order, colors 0 to 15.",
    sections: [
      {
        heading: "Where the C64 colors come from",
        paragraphs: [
          [
            "Commodore launched the C64 in 1982, and it became one of the best-selling computers of all time. Its MOS Technology VIC-II chip builds each of its 16 colors from a hue and a brightness level and sends them to the TV as a video signal. Like the NES, then, the C64 has no RGB palette of its own.",
          ],
          [
            "That’s why C64 palettes online differ. Philip “Pepto” Timmermann measured the chip’s output and published the values used here, which many emulators adopted as their default. The palette has a few saturated colors and many muted ones at similar brightness, which gives C64 art its soft, earthy feel.",
          ],
        ],
      },
      {
        heading: "Graphics modes and color limits",
        paragraphs: [
          [
            "In hi-res bitmap mode the screen is 320 × 200 pixels and each 8 × 8 cell can use 2 of the 16 colors. Multicolor mode halves the horizontal resolution to 160 × 200, with double-wide pixels, and each 4 × 8 cell can use 4 colors, one of them a background shared by the whole screen. Eight hardware sprites add moving objects on top.",
          ],
          [
            "Within those limits, C64 artists leaned on dithering and on pairing colors of similar brightness, so blends looked smooth. PixelSynth matches by color and doesn’t enforce the cell limits, so the result has the C64 palette without its clash.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Commodore 64 palette selected. It matches by color.",
      ],
      ["Set Output size to 320 pixels, the C64’s hi-res width."],
      [
        "Try ",
        algo("bayer-4-4", "Bayer 4×4"),
        " or ",
        algo("bayer-8-8", "Bayer 8×8"),
        " for the ordered patterns of demoscene art, or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " for photos.",
      ],
      ["Export at ×2 or ×4 to keep the pixels sharp."],
    ],
    examples: ["bayer-4-4", "bayer-8-8", "floyd-steinberg", "blue-noise"],
    related: ["zx-spectrum", "nes", "apple-ii"],
    faq: [
      {
        question: "Why are there different C64 palettes?",
        answer: [
          "The VIC-II output a video signal, not RGB, so every palette is a measurement or an interpretation. Pepto is the most widely used; Colodore is its author’s later, more detailed model.",
        ],
      },
      {
        question: "How many colors could the C64 show at once?",
        answer: [
          "All 16 could appear on one screen, but not everywhere: 2 per 8 × 8 cell in hi-res mode, or 4 per 4 × 8 cell in multicolor mode, one of them shared.",
        ],
      },
    ],
  },

  {
    slug: "zx-spectrum",
    name: "ZX Spectrum",
    description:
      "The 15 ZX Spectrum colors, normal and bright, with hex codes, how attribute clash works, and a free tool to dither any image to the Spectrum palette.",
    intro:
      "The Sinclair ZX Spectrum has one of the simplest palettes of any home computer: 8 colors, each in a normal and a bright version, for 15 in total, since bright black is still black. Its real signature is how it used them: two colors per 8 × 8 block, the famous attribute clash. Here are all 15 colors with hex codes, how the attributes work, and a free way to dither images to them.",
    facts: { year: "1982", hardware: "Sinclair ZX Spectrum ULA" },
    palettes: [
      {
        id: "zx-spectrum",
        names: [
          "Black",
          "Blue",
          "Red",
          "Magenta",
          "Green",
          "Cyan",
          "Yellow",
          "White",
          "Bright blue",
          "Bright red",
          "Bright magenta",
          "Bright green",
          "Bright cyan",
          "Bright yellow",
          "Bright white",
        ],
      },
    ],
    accuracy:
      "The Spectrum outputs its colors as voltage levels, which emulators render at slightly different strengths. Here normal colors sit at about 85% (#D7) and bright ones at full strength (#FF).",
    sections: [
      {
        heading: "Eight colors, two brightnesses",
        paragraphs: [
          [
            "Sinclair Research released the ZX Spectrum in 1982, and it became one of the best-selling home computers in Britain. To keep it cheap, the display is a 256 × 192 bitmap with one bit per pixel, and color is stored separately: one attribute byte for each 8 × 8 cell, 32 × 24 of them.",
          ],
          [
            "Each color is a mix of red, green and blue, each either on or off, which gives black, blue, red, magenta, green, cyan, yellow and white. The bright bit raises the channels that are on to full strength. Black has nothing to raise, so there are 15 distinct colors instead of 16.",
          ],
        ],
      },
      {
        heading: "Attribute clash",
        paragraphs: [
          [
            "Each attribute byte sets an ink color and a paper color from the 8, one bright bit for both, and a flash bit that swaps ink and paper at a steady rate. So any 8 × 8 block holds only two colors, and both are normal or both bright.",
          ],
          [
            "When a character of one color crossed a background of another, the whole block changed color: the attribute clash that gave Spectrum games their look. Many games avoided it with a single-color play area. PixelSynth doesn’t apply the two-colors-per-block rule; for a clash-free Spectrum look, stay in 1-bit mode and pick two Spectrum colors for the dots and the background.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the ZX Spectrum palette selected. It matches by color.",
      ],
      ["Set Output size to 256 pixels, the Spectrum’s resolution."],
      [
        "Use ",
        algo("bayer-2-2", "Bayer 2×2"),
        " or ",
        algo("bayer-4-4", "Bayer 4×4"),
        " for the checkerboard fills of Spectrum art, or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " for photos.",
      ],
      ["Export at ×2 or ×4 so the pixels stay square and sharp."],
    ],
    examples: ["bayer-2-2", "bayer-4-4", "floyd-steinberg", "atkinson"],
    related: ["commodore-64", "cga", "apple-ii"],
    faq: [
      {
        question: "Why do ZX Spectrum hex codes differ between sources?",
        answer: [
          "Emulators pick different levels for the normal colors, from about #B2 to #D7 (Fuse uses #C0); all approximate the same voltages. This palette uses #D7, with the bright colors at #FF.",
        ],
      },
      {
        question: "Why does the ZX Spectrum have 15 colors and not 16?",
        answer: [
          "The bright bit brightens the channels that are on. Black has none on, so bright black is the same black.",
        ],
      },
    ],
  },

  {
    slug: "cga",
    name: "CGA",
    description:
      "Both classic IBM CGA palettes, cyan/magenta and green/red, with hex codes, how the 4-color mode worked, and a free tool to dither any image to CGA colors.",
    intro:
      "IBM’s Color Graphics Adapter (CGA), from 1981, gave the first IBM PCs their colors, and its 4-color graphics mode created the look of early DOS games: cyan, magenta and white, or green, red and yellow, on black. Here are both classic CGA palettes with hex codes, how the card chose them, and a free way to dither any image to CGA colors.",
    facts: { year: "1981", hardware: "IBM Color Graphics Adapter" },
    palettes: [
      {
        id: "cga-cyan-magenta",
        heading: "Palette 1, high intensity",
        names: ["Black (background)", "Light cyan", "Light magenta", "White"],
      },
      {
        id: "cga-green-red",
        heading: "Palette 0, high intensity",
        names: ["Black (background)", "Light green", "Light red", "Yellow"],
      },
    ],
    accuracy:
      "Values are the standard RGBI levels (#00, #55, #AA, #FF), with the background set to black as most programs did, listed in palette order, 0 to 3.",
    sections: [
      {
        heading: "Four colors at 320 × 200",
        paragraphs: [
          [
            "CGA was IBM’s first color graphics card, introduced in 1981 with the IBM PC. Its text mode shows 16 colors, built from red, green and blue signals plus an intensity bit (RGBI). Graphics were limited by memory: at 320 × 200 each pixel had 2 bits, so 4 colors, and at 640 × 200 just 2.",
          ],
          [
            "In 320 × 200, a program picked one of two fixed palettes, each in low or high intensity: palette 0 with green, red and yellow (brown in low intensity), and palette 1 with cyan, magenta and white (light gray). The fourth color, the background, could be any of the 16. PixelSynth offers both palettes at high intensity on black, the best-known combinations.",
          ],
        ],
      },
      {
        heading: "Brown, mode 5 and composite tricks",
        paragraphs: [
          [
            "On IBM’s 5153 monitor, color 6 should have been dark yellow, but a circuit turns it into brown by lowering its green, which is why the RGBI palette has #AA5500. An undocumented third palette, cyan, red and white, is reachable through mode 5 on RGBI monitors, and some software used it.",
          ],
          [
            "On composite monitors and TVs, programmers exploited NTSC color artifacts: carefully placed pixel patterns produced colors the card couldn’t otherwise show. PixelSynth’s CGA presets are the RGBI colors, not these artifact colors. For the full 16, see the ",
            { text: "EGA palette", href: "/palettes/ega" },
            ", whose defaults are the same RGBI set.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with a CGA palette selected: cyan/magenta or green/red. Both match by color.",
      ],
      ["Set Output size to 320 pixels, CGA’s 4-color resolution."],
      [
        "Use ",
        algo("bayer-2-2", "Bayer 2×2"),
        " or ",
        algo("bayer-4-4", "Bayer 4×4"),
        ": with four colors, ordered patterns are what make the in-between tones.",
      ],
      [
        "Export at ×2 or ×4. On a 4:3 monitor CGA pixels were a little taller than wide; PixelSynth keeps them square.",
      ],
    ],
    examples: ["bayer-2-2", "bayer-4-4", "floyd-steinberg", "atkinson"],
    related: ["ega", "apple-ii", "zx-spectrum"],
    faq: [
      {
        question: "Why are old DOS games cyan and magenta?",
        answer: [
          "CGA’s 320 × 200 mode allowed 4 colors from two fixed palettes. Palette 1 at high intensity, black, cyan, magenta and white, is the best known of them.",
        ],
      },
      {
        question: "What’s the difference between CGA and EGA?",
        answer: [
          "CGA (1981) showed 4 colors in its main graphics mode. ",
          { text: "EGA", href: "/palettes/ega" },
          " (1984) showed 16 at once, chosen from 64, at up to 640 × 350 pixels.",
        ],
      },
    ],
  },

  {
    slug: "ega",
    name: "EGA",
    description:
      "The 16 default EGA colors with names and hex codes, how IBM’s EGA chose them from 64, and a free tool to dither any image to the EGA palette.",
    intro:
      "IBM’s Enhanced Graphics Adapter (EGA), from 1984, brought 16-color graphics to the PC. Its default 16 colors, the same as the colors of the DOS text screen, are the palette of many mid-1980s PC games. Here they are with names and hex codes, how the EGA picked them from 64, and a free way to dither images to them.",
    facts: { year: "1984", hardware: "IBM Enhanced Graphics Adapter" },
    palettes: [{ id: "ega", names: RGBI_NAMES }],
    accuracy:
      "Values are exact: the EGA has 4 levels per channel, #00, #55, #AA and #FF, and these are its 16 default slots, listed in order, 0 to 15.",
    sections: [
      {
        heading: "16 colors out of 64",
        paragraphs: [
          [
            "IBM introduced the EGA in October 1984, between CGA and the 1987 VGA. It shows 16 colors at once, at up to 640 × 350 pixels with its memory expansion, chosen from a gamut of 64: each of red, green and blue has 2 bits, so 4 levels.",
          ],
          [
            "By default the 16 slots hold CGA’s RGBI colors, including the brown (#AA5500) of CGA monitors, so software written for CGA looks the same. Programs could fill the slots with any of the 64 colors in the 350-line modes, but in the 200-line modes most games used, the EGA drives its monitor as a CGA one, and only the 16 defaults are available.",
          ],
        ],
      },
      {
        heading: "The look of EGA games",
        paragraphs: [
          [
            "Early EGA support came in games like The Ancient Art of War (1984) and King’s Quest III (1986), and by the early 1990s most PC software could run in EGA, often at 320 × 200 for compatibility. Commander Keen is one of the best-known EGA games.",
          ],
          [
            "With a fixed set of bright, saturated colors, EGA artists used dither patterns to fake the tones in between: skin, skies and shadows are often checkerboards of two colors. Ordered dithering reproduces that look closely.",
          ],
        ],
      },
    ],
    steps: [
      ["Open the editor with the EGA palette selected. It matches by color."],
      ["Set Output size to 320 pixels, the resolution of most EGA games."],
      [
        "Use ",
        algo("bayer-4-4", "Bayer 4×4"),
        " or ",
        algo("bayer-2-2", "Bayer 2×2"),
        " for EGA-style checkerboards, or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " for photos.",
      ],
      ["Export at ×2 or ×4."],
    ],
    examples: ["bayer-4-4", "bayer-2-2", "floyd-steinberg", "blue-noise"],
    related: ["cga", "commodore-64", "apple-ii"],
    faq: [
      {
        question: "How many colors does EGA have?",
        answer: [
          "16 at once, from a gamut of 64. The 16 defaults are the CGA text colors, and in 200-line modes they are the only ones available.",
        ],
      },
      {
        question: "What’s the difference between EGA and VGA?",
        answer: [
          "VGA (1987) added a 320 × 200 mode with 256 colors on screen, chosen from 262,144. EGA’s 16 colors are also VGA’s default text colors.",
        ],
      },
    ],
  },

  {
    slug: "apple-ii",
    name: "Apple II",
    description:
      "The 6 Apple II hi-res colors with hex codes, how NTSC artifact color created them, and a free tool to dither any image into Apple II colors in your browser.",
    intro:
      "The Apple II’s high-resolution mode has only six colors: black, white, green, purple, orange and blue. They don’t come from a palette at all, but from a quirk of the color TV signal that Steve Wozniak turned into a feature. Here are the six hex codes, how artifact color works, and a free way to dither any image into Apple II colors.",
    facts: { year: "1977", hardware: "Apple II hi-res, 280 × 192" },
    palettes: [
      {
        id: "apple-ii",
        names: ["Black", "Green", "Purple", "Orange", "Blue", "White"],
      },
    ],
    accuracy:
      "The colors are artifacts of the NTSC signal, not stored values. These hex codes are Wikipedia’s conversion of the hi-res colors’ signal values to sRGB.",
    sections: [
      {
        heading: "Color from a TV signal",
        paragraphs: [
          [
            "Apple released the Apple II in 1977, with color graphics designed by Steve Wozniak on very few chips. The hi-res mode doesn’t store colors: it stores lit and dark dots at 280 × 192, and on a color TV the timing of each dot against the color signal makes the TV see it as a color. Two lit dots side by side read as white.",
          ],
          [
            "Each byte of screen memory holds 7 pixels plus one bit that shifts their timing by half a pixel. With that bit clear, the dots show as green or purple depending on their column; with it set, as orange or blue. That gives 8 combinations and 6 colors, since black and white appear twice.",
          ],
        ],
      },
      {
        heading: "Color limits and fringing",
        paragraphs: [
          [
            "Because a dot’s color depends on its column, color resolution is only 140 pixels across. And the shift bit covers a whole 7-pixel byte, so green or purple can’t share a byte with orange or blue: drawing a blue line over a green one turns parts of the green orange. Edges show colored fringes, which are part of the Apple II look.",
          ],
          [
            "PixelSynth dithers freely with the six colors and doesn’t simulate the byte rule or the fringing, so the result has the Apple II palette with cleaner edges than the real machine.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Apple II hi-res palette selected. It matches by color.",
      ],
      [
        "Set Output size to 280 pixels, or 140 for the Apple II’s real color resolution.",
      ],
      [
        "With six colors, ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " keeps the most detail; ",
        algo("bayer-2-2", "Bayer 2×2"),
        " gives the striped fills of Apple II art.",
      ],
      ["Export at ×2 or ×4."],
    ],
    examples: ["floyd-steinberg", "bayer-2-2", "bayer-4-4", "atkinson"],
    related: ["commodore-64", "cga", "zx-spectrum"],
    faq: [
      {
        question: "Why does the Apple II have only six colors in hi-res?",
        answer: [
          "The colors come from where dots fall against the TV’s color signal. One bit per byte picks between two color pairs, green and purple or orange and blue, and together with black and white that makes six.",
        ],
      },
      {
        question: "Didn’t the Apple II have 16 colors?",
        answer: [
          "In its low-resolution mode, yes: 40 × 48 blocks in 16 colors. Later models added a double hi-res mode with 16 colors too. This palette covers the hi-res mode.",
        ],
      },
    ],
  },

  {
    slug: "msx",
    updated: "2026-10-08",
    name: "MSX",
    description:
      "The 15 MSX colors of the TI TMS9918 video chip with names and hex codes, its 2-colors-per-line rule, and a free tool to dither any image to MSX colors.",
    intro:
      "MSX computers drew everything with Texas Instruments’ TMS9918 video chip and its fixed set of 15 colors. Below are all of them with names and hex codes, how the chip’s 2-colors-per-line rule shaped MSX graphics, and a free way to dither any image to the MSX palette in your browser.",
    facts: { year: "1983", hardware: "TI TMS9918, 256 × 192" },
    palettes: [
      {
        id: "msx",
        names: [
          "Black",
          "Medium green",
          "Light green",
          "Dark blue",
          "Light blue",
          "Dark red",
          "Cyan",
          "Medium red",
          "Light red",
          "Dark yellow",
          "Light yellow",
          "Dark green",
          "Magenta",
          "Gray",
          "White",
        ],
      },
    ],
    accuracy:
      "The TMS9918 outputs analog color signals, not RGB values. These are its datasheet levels converted to sRGB, as listed on Wikipedia; emulators and capture cards differ slightly, especially in the greens. Color 0 is transparent, so 15 colors are listed, in chip order 1 to 15.",
    sections: [
      {
        heading: "One standard, many manufacturers",
        paragraphs: [
          [
            "Microsoft and ASCII Corporation, led by Kazuhiko Nishi, announced MSX in 1983 as a common standard for home computers: any MSX machine, whether made by Sony, Panasonic, Philips or others, ran the same software. It sold best in Japan, the Netherlands, Spain and Brazil.",
          ],
          [
            "The first generation used the TMS9918, the same video chip as the TI-99/4A, the ColecoVision and Sega’s SG-1000, so all of them share this palette. MSX2 (1985) moved to the Yamaha V9938, which picks its colors from 512.",
          ],
        ],
      },
      {
        heading: "Two colors per line of eight pixels",
        paragraphs: [
          [
            "In its 256 × 192 bitmap mode, the TMS9918 stores one foreground and one background color for every row of 8 pixels. That’s finer than the ZX Spectrum’s 8 × 8 attribute cells, so color clash is milder, but neighboring details on the same row still can’t use three colors. Up to 32 sprites add color on top, at most 4 per scanline.",
          ],
          [
            "MSX artists worked around the limit with dither patterns and careful color pairs, and the palette’s soft greens, blues and reds give MSX games their look. PixelSynth matches this palette by color and doesn’t enforce the per-row rule, so the result has more color freedom than the hardware allowed.",
          ],
        ],
      },
    ],
    steps: [
      ["Open the editor with the MSX palette selected. It matches by color."],
      ["Set Output size to 256 pixels, the TMS9918’s width."],
      [
        "Use ",
        algo("bayer-4-4", "Bayer 4×4"),
        " for regular, period-style patterns or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " for photos.",
      ],
      ["Save the PNG at ×2 or ×4 to keep the pixels sharp."],
    ],
    examples: ["bayer-4-4", "floyd-steinberg", "bayer-2-2", "blue-noise"],
    related: ["zx-spectrum", "commodore-64", "nes"],
    faq: [
      {
        question: "How many colors does the MSX have?",
        answer: [
          "The first generation shows 15 fixed colors plus transparent. MSX2 and later pick 16 at a time from 512, so this palette is the MSX1 one.",
        ],
      },
      {
        question:
          "Does this palette work for the ColecoVision or the TI-99/4A?",
        answer: [
          "Yes. They use the same TMS9918 family of video chips, so the colors are the same, give or take how each TV or emulator decodes them.",
        ],
      },
    ],
  },

  {
    slug: "riso",
    updated: "2026-10-08",
    name: "Riso",
    description:
      "Riso Fluorescent Pink and Blue ink hex codes with black and paper, how risograph printing works, and a free tool to dither any image to a riso look.",
    intro:
      "Risograph prints are known for vivid, slightly grainy ink on uncoated paper. This palette uses two of Riso’s official ink colors, Fluorescent Pink (#FF48B0) and Blue (#0078BF), plus black, on a warm paper white. Below are the hex codes, how a risograph prints, and a free way to give any image a riso look in your browser.",
    facts: {
      year: "1980s",
      hardware: "Riso digital duplicator",
      label: "Process",
    },
    palettes: [
      {
        id: "riso",
        names: ["Paper", "Fluorescent Pink", "Blue", "Black"],
      },
    ],
    accuracy:
      "Pink and blue are the screen values Riso publishes for its Fluorescent Pink and Blue inks. Real ink looks different on every paper, and fluorescent pink is brighter than any screen can show. Black is pure black and the paper is an off-white chosen for this palette.",
    sections: [
      {
        heading: "How a risograph prints",
        paragraphs: [
          [
            "The Risograph is a digital duplicator made by the Riso Kagaku Corporation of Tokyo. It scans or receives an image, burns it as tiny holes into a thin master sheet with a thermal head, wraps the master around an ink drum and pushes ink through the holes onto paper, page after page, quickly and cheaply.",
          ],
          [
            "Each drum holds one ink, so a print in two colors goes through the machine twice, or through a two-drum model once. The inks are semi-transparent, so pink printed over blue makes purple, and the layers never line up perfectly: that slight misregistration is part of the look zines, posters and art books adopted.",
          ],
        ],
      },
      {
        heading: "Why riso is already dithered",
        paragraphs: [
          [
            "A master either has a hole or it doesn’t, so a risograph can’t print a gray: every tone is a pattern of dots, from a halftone screen or a grain-like diffusion pattern. That’s why dithering and riso go together so well, and why a dithered image prints on a risograph much as it looks on screen.",
          ],
          [
            "This palette dithers the image to all four colors at once, by brightness. It gives the riso look on screen, but it doesn’t separate the inks or mix overprints: to print, make one grayscale layer per ink, for example by dithering a copy of the image in 1-bit for each color.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Riso palette selected. It matches by brightness.",
      ],
      [
        "Choose ",
        algo("halftone", "Halftone"),
        " for a classic print screen or ",
        algo("blue-noise", "Blue Noise"),
        " for an even, grainy texture.",
      ],
      [
        "Adjust contrast and gamma until the pink and blue land where you want them, then save the PNG at full size for print or ×2 for screens.",
      ],
    ],
    examples: [
      "halftone",
      "blue-noise",
      "floyd-steinberg",
      "clustered-dot-halftone-ordered",
    ],
    related: ["newsprint", "cyanotype", "sepia"],
    faq: [
      {
        question: "Can I print this file on a risograph as it is?",
        answer: [
          "Not directly: a risograph needs one grayscale layer per ink. Use the palette to preview the look, then dither a 1-bit copy of the image for each ink and send those layers to print.",
        ],
      },
      {
        question: "Why does fluorescent pink look duller on my screen?",
        answer: [
          "Fluorescent ink turns ultraviolet light into visible pink, so it glows brighter than any color a screen can make. #FF48B0 is Riso’s screen approximation.",
        ],
      },
    ],
  },

  {
    slug: "cyanotype",
    updated: "2026-10-08",
    name: "Cyanotype",
    description:
      "Cyanotype blue hex codes from deep Prussian blue to paper, the history of the 1842 sun-print process, and a free tool to give any image a cyanotype look.",
    intro:
      "A cyanotype is a photograph printed in Prussian blue by sunlight, and it’s where the word blueprint comes from. This palette has four tones, from deep blue to paper white. Below are the hex codes, how the process works, and a free way to turn any image into a cyanotype-style dither in your browser.",
    facts: {
      year: "1842",
      hardware: "Iron salts and sunlight",
      label: "Process",
    },
    palettes: [
      {
        id: "cyanotype",
        names: ["Deep Prussian blue", "Prussian blue", "Faded blue", "Paper"],
      },
    ],
    accuracy:
      "There is no standard cyanotype color: the blue depends on the paper, the exposure and the wash. These four tones, chosen for this palette, follow the range of a typical print, from fully exposed areas to bare paper.",
    sections: [
      {
        heading: "Herschel’s blue prints",
        paragraphs: [
          [
            "The astronomer Sir John Herschel discovered the process in 1842. Paper is coated with ferric ammonium citrate and potassium ferricyanide, dried in the dark and exposed to sunlight under a negative or an object. Where light hits, the iron salts turn into insoluble Prussian blue; rinsing in water washes away the rest and leaves white paper.",
          ],
          [
            "In 1843 the botanist Anna Atkins used it for Photographs of British Algae: Cyanotype Impressions, laying seaweed straight on the paper; it is considered the first book illustrated with photographs. Later in the century engineers and architects copied drawings the same way, white lines on blue, and the blueprint was born.",
          ],
        ],
      },
      {
        heading: "Dithering a cyanotype look",
        paragraphs: [
          [
            "A real cyanotype is continuous tone, but its single blue makes it a natural fit for a short brightness palette: four tones of one hue read as one ink on paper, and dithering fills in the steps between them.",
          ],
          [
            "PixelSynth matches this palette by brightness, so the darkest parts of the image become the deepest blue and highlights fall back to paper, whatever their original color. Soft algorithms like ",
            algo("atkinson", "Atkinson"),
            " keep the airy, washed-out highlights of a sun print.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Cyanotype palette selected. It matches by brightness.",
      ],
      [
        "Pick ",
        algo("atkinson", "Atkinson"),
        " for bright, open highlights or ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " to keep more detail.",
      ],
      [
        "Lower the white point to push more of the image toward deep blue, and save the PNG at ×2 or larger.",
      ],
    ],
    examples: ["atkinson", "floyd-steinberg", "blue-noise", "line-screen"],
    related: ["sepia", "newsprint", "riso"],
    faq: [
      {
        question: "Can I use the result to make a real cyanotype?",
        answer: [
          "As a reference, yes. To print one, you need a negative: invert a grayscale or 1-bit version of the image, print it on transparency film and expose the coated paper through it.",
        ],
      },
      {
        question: "Why is it called a blueprint?",
        answer: [
          "Engineers copied technical drawings with the cyanotype process from the late 19th century on, which gave white lines on a blue ground. The name stuck even after other copying methods replaced it.",
        ],
      },
    ],
  },

  {
    slug: "newsprint",
    updated: "2026-10-08",
    name: "Newsprint",
    description:
      "Newsprint ink and yellowed paper hex codes, how newspapers print photos as halftone dots, and a free tool to give any image a newspaper halftone look.",
    intro:
      "Newspapers print photos as patterns of ink dots on cheap, slightly yellow paper. This 1-bit palette pairs a soft black ink with aged newsprint, so a dither looks printed rather than on screen. Below are both hex codes, how newspaper halftones work, and a free way to give any image the look in your browser.",
    facts: {
      year: "1880",
      hardware: "Halftone on newsprint",
      label: "Process",
    },
    palettes: [{ id: "newsprint", names: ["Ink", "Newsprint"] }],
    accuracy:
      "Both values were chosen for this palette: a warm black, since ink on absorbent paper never reaches pure black, and a cream like newsprint a few years old. Fresh newsprint is grayer and whiter.",
    sections: [
      {
        heading: "Photos made of dots",
        paragraphs: [
          [
            "A printing press lays down ink or no ink, so it can’t print a gray. Halftone screens solve that by breaking a photo into dots that grow in the shadows and shrink in the highlights. On March 4, 1880, The Daily Graphic of New York printed “A Scene in Shantytown,” one of the first halftone photographs in a newspaper, and within a few decades halftones replaced engraved illustrations.",
          ],
          [
            "Newsprint soaks up ink and makes dots spread, so newspapers use coarse screens, often around 85 lines per inch, where magazines on coated paper use 150 or more. Those visible dots are the newspaper look.",
          ],
        ],
      },
      {
        heading: "Why the paper turns yellow",
        paragraphs: [
          [
            "Newsprint is made from mechanical wood pulp, which keeps most of the wood’s lignin. Light and air oxidize the lignin and the paper turns yellow, then brown, within years, which is why old clippings look warm. This palette uses that aged tone instead of pure white.",
          ],
          [
            "PixelSynth matches this palette by brightness: everything darker than the threshold becomes ink. Pair it with ",
            algo("halftone", "Halftone"),
            " for round newspaper dots or ",
            algo("line-screen", "Line Screen"),
            " for an engraved look.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Newsprint palette selected. It matches by brightness.",
      ],
      [
        "Choose ",
        algo("halftone", "Halftone"),
        " and raise its screen size until the dots read from a distance.",
      ],
      [
        "Add a little contrast, since newspaper photos lose their midtones, and save the PNG at full size or ×2.",
      ],
    ],
    examples: [
      "halftone",
      "clustered-dot-halftone-ordered",
      "line-screen",
      "floyd-steinberg",
    ],
    related: ["riso", "sepia", "cyanotype"],
    faq: [
      {
        question: "What resolution were newspaper halftones?",
        answer: [
          "Commonly 65 to 100 lines per inch, with 85 typical. Coarser screens hold up better on absorbent paper, where every dot spreads.",
        ],
      },
      {
        question: "Can I use pure black and white instead?",
        answer: [
          "Yes: the editor’s 1-bit mode prints black and white, or any two colors you pick. This palette is the same idea with ink and paper tones.",
        ],
      },
    ],
  },

  {
    slug: "sepia",
    updated: "2026-10-08",
    name: "Sepia",
    description:
      "Four sepia tone hex codes from deep brown to paper, where sepia toning came from, and a free tool to dither any photo to an antique sepia look.",
    intro:
      "Sepia is the warm brown of old photographs. This palette has four tones, from deep brown to aged paper, that turn any image into an antique-looking dither. Below are the hex codes, where sepia toning came from, and a free way to apply it in your browser.",
    facts: {
      year: "1880s",
      hardware: "Silver sulfide toning",
      label: "Process",
    },
    palettes: [
      {
        id: "sepia",
        names: ["Deep brown", "Umber", "Tan", "Paper"],
      },
    ],
    accuracy:
      "There is no standard sepia: every print toned differently with paper, chemistry and age. These four tones, chosen for this palette, cover the range of a typical toned print, from the darkest shadows to the paper base.",
    sections: [
      {
        heading: "A pigment, then a darkroom process",
        paragraphs: [
          [
            "Sepia was first an ink and a pigment, the brown made from the ink sac of the cuttlefish, whose genus is Sepia. In photography the name moved to toning: bathing a black-and-white silver print in a sulfide solution turns its metallic silver into silver sulfide, which is brown.",
          ],
          [
            "Toning was common from the late 19th century into the early 20th, and not only for the color: silver sulfide resists air and pollution far better than plain silver, so sepia prints last longer. That durability is why so many surviving photos from the period are brown.",
          ],
        ],
      },
      {
        heading: "Sepia in four tones",
        paragraphs: [
          [
            "A sepia print shows shadows in dark brown and highlights in the warm paper, with a smooth range in between. Four tones of one hue keep that range readable, and dithering fills in the steps.",
          ],
          [
            "PixelSynth matches this palette by brightness, so colors don’t matter, only how light or dark each area is. Use ",
            algo("floyd-steinberg", "Floyd–Steinberg"),
            " for portraits, or ",
            algo("blue-noise", "Blue Noise"),
            " for a fine film-like grain.",
          ],
        ],
      },
    ],
    steps: [
      [
        "Open the editor with the Sepia palette selected. It matches by brightness.",
      ],
      [
        "Pick ",
        algo("floyd-steinberg", "Floyd–Steinberg"),
        " for detail or ",
        algo("blue-noise", "Blue Noise"),
        " for a film-like grain.",
      ],
      [
        "Lower the contrast slightly for a faded look, then save the PNG at ×2 or larger.",
      ],
    ],
    examples: ["floyd-steinberg", "atkinson", "blue-noise", "bayer-8-8"],
    related: ["cyanotype", "newsprint", "riso"],
    faq: [
      {
        question: "Is this the same as a sepia filter?",
        answer: [
          "A sepia filter tints every pixel brown and keeps smooth gradients. This palette reduces the image to four brown tones and dithers between them, so it looks printed.",
        ],
      },
      {
        question: "Why are old photos brown?",
        answer: [
          "Many were sepia toned on purpose, which made them more durable, and untoned prints also yellow and brown as their silver and paper age.",
        ],
      },
    ],
  },
];

const bySlug = new Map(PALETTE_GUIDES.map((guide) => [guide.slug, guide]));
const byPalette = new Map(
  PALETTE_GUIDES.flatMap((guide) =>
    guide.palettes.map(({ id }) => [id, guide] as const),
  ),
);

export function getPaletteGuide(slug: string) {
  return bySlug.get(slug);
}

/** The guide page covering a preset, if it has one. */
export function guideForPalette(id: string) {
  return byPalette.get(id);
}

/** Where to link a palette: its guide page, or its card on /palettes. */
export function paletteHref(id: string) {
  const guide = byPalette.get(id);
  return guide ? `/palettes/${guide.slug}` : `/palettes#palette-${id}`;
}

export function guidePresets(guide: PaletteGuide) {
  return guide.palettes.map(
    (entry) => ({ ...entry, preset: getPalettePreset(entry.id)! }) as const,
  ) satisfies { preset: PalettePreset }[];
}

/** Page title, before the site name. */
export const paletteGuideTitle = (guide: PaletteGuide) =>
  `${guide.name} Palette: Hex Codes and Examples`;

/** Lospec-style .hex file: one RRGGBB per line. */
export function hexFile(preset: PalettePreset) {
  return preset.colors.map((c) => c.slice(1).toUpperCase()).join("\n") + "\n";
}

/** GIMP .gpl file, the format Lospec and most pixel art editors read. */
export function gplFile(preset: PalettePreset, names?: readonly string[]) {
  return [
    "GIMP Palette",
    `Name: ${preset.name}`,
    `Columns: ${Math.min(preset.colors.length, 16)}`,
    "#",
    ...preset.colors.map(
      (color, index) =>
        `${hexToRgb(color)
          .map((v) => String(v).padStart(3))
          .join(" ")}\t${names?.[index] ?? `Color ${index}`}`,
    ),
    "",
  ].join("\n");
}
