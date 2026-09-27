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
  /** Compact name for tight UI (selects, steppers, footer). */
  shortName: string;
  category: AlgorithmCategory;
  era: "classic" | "modern";
  description: string;
  /**
   * How involved the method is, not its speed: "low" for a fixed threshold
   * per pixel, "medium" for error diffusion (sequential, with an error
   * buffer) or a rotated screen, "high" when the threshold matrix itself is
   * built by optimization (void-and-cluster).
   */
  complexity: "low" | "medium" | "high";
  year: string | null;
  author: string | null;
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
    preview: "/specimens/floyd-steinberg.png",
  },
  {
    slug: "jarvis-judice-and-ninke-jjn",
    name: "Jarvis, Judice, and Ninke (JJN)",
    shortName: "Jarvis–Judice–Ninke",
    category: "error-diffusion",
    era: "classic",
    description:
      "Spreads the error over 12 neighbors for smoother, more natural textures, at a slower speed.",
    complexity: "medium",
    year: "1976",
    author: "J.F. Jarvis, C.N. Judice & W.H. Ninke",
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
    complexity: "medium",
    year: "1981",
    author: "Peter Stucki",
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
    year: "1989",
    author: "Frankie Sierra",
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
    complexity: "medium",
    year: "1990",
    author: "Frankie Sierra",
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
    complexity: "medium",
    year: "1990",
    author: "Frankie Sierra",
    preview: "/specimens/sierra-lite.png",
  },
  {
    slug: "atkinson",
    name: "Atkinson",
    shortName: "Atkinson",
    category: "error-diffusion",
    era: "classic",
    description:
      "Passes on only 3/4 of the error, so highlights and shadows clip to clean white and black. The crisp, stippled look of the early Macintosh.",
    complexity: "medium",
    year: "1984",
    author: "Bill Atkinson (Apple)",
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
    complexity: "low",
    year: "1973",
    author: "Bryce Bayer",
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
    complexity: "low",
    year: "1980s",
    author: "Various researchers",
    preview: "/specimens/clustered-dot-halftone-ordered.png",
  },
  {
    slug: "blue-noise",
    name: "Blue Noise",
    shortName: "Blue Noise",
    category: "ordered",
    era: "modern",
    description:
      "Compares each pixel with a tiled blue-noise threshold matrix. Dots spread evenly with no visible grid, for a fine, natural grain.",
    complexity: "high",
    year: "1993",
    author: "Robert Ulichney",
    preview: "/specimens/blue-noise.png",
  },
  {
    slug: "random-dither",
    name: "Random Dither",
    shortName: "Random",
    category: "noise",
    era: "modern",
    description:
      "Compares each pixel with a random threshold, for a coarse, grainy texture.",
    complexity: "low",
    year: null,
    author: null,
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
    preview: "/specimens/void-and-cluster.png",
  },
  {
    slug: "halftone",
    name: "Halftone",
    shortName: "Halftone",
    category: "screen",
    era: "classic",
    description:
      "Round, square or diamond dots on an angled grid that grow with the shadows, like newsprint. Set the screen size and angle.",
    complexity: "medium",
    year: "1880s",
    author: "Frederic Ives",
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
    complexity: "medium",
    year: null,
    author: null,
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

/** Name before the word "dithering": "Random Dither" reads "Random". */
export function ditheringName(algorithm: Pick<AlgorithmInfo, "name">) {
  return algorithm.name.replace(/ Dither$/, "");
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
