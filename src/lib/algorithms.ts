/**
 * Single source of truth for the dithering algorithm catalog.
 *
 * `slug` doubles as the algorithm id used by the editor and as the public
 * anchor (`/algorithms#algorithm-<slug>`) and detail URL
 * (`/algorithms/<slug>`) — never change an existing slug.
 */

export const ALGORITHM_CATEGORIES = [
  {
    id: "error-diffusion",
    name: "Error diffusion",
    description:
      "Each pixel is rounded to black or white and the rounding error is pushed onto the neighbors still to be processed. Organic and detailed.",
  },
  {
    id: "ordered",
    name: "Ordered",
    description:
      "Each pixel is compared with a threshold matrix tiled across the image. Fast, parallel and deliberately textured.",
  },
  {
    id: "noise",
    name: "Noise-based",
    description:
      "Thresholds come from noise instead of a fixed pattern, trading structure for grain.",
  },
  {
    id: "screen",
    name: "Halftone screen",
    description:
      "A grid of dots or lines, turned to an angle like a print screen, grows with the tone. Screen size, angle and dot shape are adjustable.",
  },
] as const;

export type AlgorithmCategory = (typeof ALGORITHM_CATEGORIES)[number]["id"];

export type AlgorithmInfo = {
  slug: string;
  /** Full display name. */
  name: string;
  /** Compact name for tight UI (marquee, selects). */
  shortName: string;
  category: AlgorithmCategory;
  era: "classic" | "modern";
  description: string;
  complexity: "low" | "medium" | "high";
  year: string | null;
  author: string | null;
  /** Relative processing cost, 1 (cheap) to 5 (expensive). */
  cost: 1 | 2 | 3 | 4 | 5;
  /** The specimen (PREVIEW_SOURCE) rendered with this algorithm in 1-bit. */
  preview: string;
};

export const ALGORITHMS = [
  {
    slug: "floyd-steinberg",
    name: "Floyd–Steinberg",
    shortName: "Floyd–Steinberg",
    category: "error-diffusion",
    era: "classic",
    description:
      "Diffuses the quantization error across 4 neighboring pixels. Produces smooth and detailed results with an excellent balance between quality and performance.",
    complexity: "medium",
    year: "1976",
    author: "Robert W. Floyd & Louis Steinberg",
    cost: 3,
    preview: "/specimens/floyd-steinberg.png",
  },
  {
    slug: "jarvis-judice-and-ninke-jjn",
    name: "Jarvis, Judice, and Ninke (JJN)",
    shortName: "Jarvis–Judice–Ninke",
    category: "error-diffusion",
    era: "classic",
    description:
      "Spreads the error over 12 pixels, creating smoother and more natural textures, though at a slower speed.",
    complexity: "high",
    year: "1976",
    author: "J.F. Jarvis, C.N. Judice & W.H. Ninke",
    cost: 4,
    preview: "/specimens/jarvis-judice-and-ninke-jjn.png",
  },
  {
    slug: "stucki",
    name: "Stucki",
    shortName: "Stucki",
    category: "error-diffusion",
    era: "classic",
    description:
      "An optimized version of JJN with smaller weights. Produces sharper results with excellent detail preservation.",
    complexity: "high",
    year: "1981",
    author: "Peter Stucki",
    cost: 4,
    preview: "/specimens/stucki.png",
  },
  {
    slug: "burkes",
    name: "Burkes",
    shortName: "Burkes",
    category: "error-diffusion",
    era: "classic",
    description:
      "A faster variant of Stucki with comparable quality. Uses diffusion across two lines for efficient processing.",
    complexity: "medium",
    year: "1988",
    author: "Daniel Burkes",
    cost: 2,
    preview: "/specimens/burkes.png",
  },
  {
    slug: "sierra",
    name: "Sierra",
    shortName: "Sierra",
    category: "error-diffusion",
    era: "classic",
    description:
      "Balances quality and performance with a three-line diffusion. Produces natural and crisp textures.",
    complexity: "medium",
    year: "1986",
    author: "Frank Sierra",
    cost: 3,
    preview: "/specimens/sierra.png",
  },
  {
    slug: "two-row-sierra",
    name: "Two-Row Sierra",
    shortName: "Two-Row Sierra",
    category: "error-diffusion",
    era: "classic",
    description:
      "Reduced version of Sierra using two diffusion rows. Faster execution with slight quality loss.",
    complexity: "low",
    year: "1986",
    author: "Frank Sierra",
    cost: 2,
    preview: "/specimens/two-row-sierra.png",
  },
  {
    slug: "sierra-lite",
    name: "Sierra Lite",
    shortName: "Sierra Lite",
    category: "error-diffusion",
    era: "classic",
    description:
      "Lightweight and fast variant of Sierra, ideal for real-time applications or previews.",
    complexity: "low",
    year: "1986",
    author: "Frank Sierra",
    cost: 1,
    preview: "/specimens/sierra-lite.png",
  },
  {
    slug: "atkinson",
    name: "Atkinson",
    shortName: "Atkinson",
    category: "error-diffusion",
    era: "classic",
    description:
      "Creates crisp, retro-style dot patterns. Uses fewer diffusion pixels, resulting in a distinct stippled appearance.",
    complexity: "low",
    year: "1984",
    author: "Bill Atkinson (Apple)",
    cost: 2,
    preview: "/specimens/atkinson.png",
  },
  {
    slug: "bayer-2-2",
    name: "Bayer 2×2",
    shortName: "Bayer 2×2",
    category: "ordered",
    era: "classic",
    description:
      "Smallest Bayer matrix. Produces visible patterns and a distinct pixelated look.",
    complexity: "low",
    year: "1973",
    author: "Bryce Bayer",
    cost: 1,
    preview: "/specimens/bayer-2-2.png",
  },
  {
    slug: "bayer-4-4",
    name: "Bayer 4×4",
    shortName: "Bayer 4×4",
    category: "ordered",
    era: "classic",
    description:
      "Common Bayer matrix. Strikes a balance between smoothness and perceptible patterning.",
    complexity: "low",
    year: "1973",
    author: "Bryce Bayer",
    cost: 1,
    preview: "/specimens/bayer-4-4.png",
  },
  {
    slug: "bayer-8-8",
    name: "Bayer 8×8",
    shortName: "Bayer 8×8",
    category: "ordered",
    era: "classic",
    description:
      "Larger Bayer matrix that minimizes visible patterns, resulting in smoother gradients.",
    complexity: "medium",
    year: "1973",
    author: "Bryce Bayer",
    cost: 2,
    preview: "/specimens/bayer-8-8.png",
  },
  {
    slug: "clustered-dot-halftone-ordered",
    name: "Clustered Dot (Halftone Ordered)",
    shortName: "Clustered Dot",
    category: "ordered",
    era: "classic",
    description:
      "Groups pixels to simulate offset printing. Ideal for ink-dot or halftone-style appearances.",
    complexity: "medium",
    year: "1980s",
    author: "Various researchers",
    cost: 2,
    preview: "/specimens/clustered-dot-halftone-ordered.png",
  },
  {
    slug: "blue-noise",
    name: "Blue Noise",
    shortName: "Blue Noise",
    category: "ordered",
    era: "modern",
    description:
      "Uses a blue-noise matrix for balanced error distribution. Avoids visible patterns, producing a natural look.",
    complexity: "high",
    year: "1993",
    author: "Robert Ulichney",
    cost: 4,
    preview: "/specimens/blue-noise.png",
  },
  {
    slug: "random-dither",
    name: "Random Dither",
    shortName: "Random",
    category: "noise",
    era: "modern",
    description:
      "Applies purely random thresholds, producing a grainy texture with noticeable noise characteristics.",
    complexity: "low",
    year: null,
    author: null,
    cost: 1,
    preview: "/specimens/random-dither.png",
  },
  {
    slug: "void-and-cluster",
    name: "Void-and-Cluster",
    shortName: "Void-and-Cluster",
    category: "noise",
    era: "modern",
    description:
      "Generates a procedurally balanced distribution of dots and voids. Produces a smooth, organic texture.",
    complexity: "high",
    year: "1993",
    author: "Robert Ulichney",
    cost: 4,
    preview: "/specimens/void-and-cluster.png",
  },
  {
    slug: "halftone",
    name: "Halftone",
    shortName: "Halftone",
    category: "screen",
    era: "classic",
    description:
      "Round, square or diamond dots on an angled grid, growing with the shadows like newspaper and offset print. Set the screen size and angle.",
    complexity: "medium",
    year: "1880s",
    author: "Frederic Ives",
    cost: 2,
    preview: "/specimens/halftone.png",
  },
  {
    slug: "line-screen",
    name: "Line Screen",
    shortName: "Line Screen",
    category: "screen",
    era: "classic",
    description:
      "Parallel lines whose thickness follows the tone, like an engraving or a banknote. Set the line spacing and angle, let the light lift the lines like an oscilloscope, or make them wave.",
    complexity: "low",
    year: null,
    author: null,
    cost: 2,
    preview: "/specimens/line-screen.png",
  },
] as const satisfies readonly AlgorithmInfo[];

export type AlgorithmId = (typeof ALGORITHMS)[number]["slug"];

export const DEFAULT_ALGORITHM: AlgorithmId = "floyd-steinberg";

/**
 * The specimen every preview is rendered from, and their "before" image: a
 * CRT terminal on a checkered table (scripts/specimen-scene.mjs). 400 px is
 * the smallest size where the halftone screens still read.
 */
export const PREVIEW_SOURCE = "/specimens/terminal.png";
export const PREVIEW_SIZE = 400;

export type Algorithm = (typeof ALGORITHMS)[number];

const bySlug = new Map<string, Algorithm>(
  ALGORITHMS.map((algorithm) => [algorithm.slug, algorithm]),
);

export function getAlgorithm(slug: string): Algorithm | undefined {
  return bySlug.get(slug);
}

export function isAlgorithmId(value: string): value is AlgorithmId {
  return bySlug.has(value);
}

export function getCategory(category: AlgorithmCategory) {
  return ALGORITHM_CATEGORIES.find((c) => c.id === category)!;
}

export function getCategoryName(category: AlgorithmCategory) {
  return getCategory(category).name;
}

export function algorithmsByCategory() {
  return ALGORITHM_CATEGORIES.map((category) => ({
    ...category,
    algorithms: ALGORITHMS.filter((a) => a.category === category.id),
  }));
}
