/**
 * Single source of truth for the dithering algorithm catalog.
 *
 * `slug` doubles as the algorithm id used by the editor and as the public
 * anchor (`/algorithms#algorithm-<slug>`) and detail URL
 * (`/algorithms/<slug>`) — never change an existing slug.
 */

export const ALGORITHM_CATEGORIES = [
  { id: "error-diffusion", name: "Error diffusion" },
  { id: "ordered", name: "Ordered" },
  { id: "noise", name: "Noise-based" },
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
  /** 250×250 sphere rendered with this algorithm. */
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
    preview: "/250/pixel-synth.png",
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
    preview: "/250/pixel-synth-1.png",
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
    preview: "/250/pixel-synth-2.png",
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
    preview: "/250/pixel-synth-3.png",
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
    preview: "/250/pixel-synth-4.png",
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
    preview: "/250/pixel-synth-5.png",
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
    preview: "/250/pixel-synth-6.png",
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
    preview: "/250/pixel-synth-7.png",
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
    preview: "/250/pixel-synth-8.png",
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
    preview: "/250/pixel-synth-9.png",
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
    preview: "/250/pixel-synth-10.png",
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
    preview: "/250/pixel-synth-11.png",
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
    preview: "/250/pixel-synth-12.png",
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
    preview: "/250/pixel-synth-13.png",
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
    preview: "/250/pixel-synth-14.png",
  },
] as const satisfies readonly AlgorithmInfo[];

export type AlgorithmId = (typeof ALGORITHMS)[number]["slug"];

export const DEFAULT_ALGORITHM: AlgorithmId = "floyd-steinberg";

/** Sphere render used as the "before" image for every preview. */
export const PREVIEW_SOURCE = "/250/sphere-250.png";

const bySlug = new Map<string, AlgorithmInfo>(
  ALGORITHMS.map((algorithm) => [algorithm.slug, algorithm]),
);

export function getAlgorithm(slug: string): AlgorithmInfo | undefined {
  return bySlug.get(slug);
}

export function isAlgorithmId(value: string): value is AlgorithmId {
  return bySlug.has(value);
}

export function getCategoryName(category: AlgorithmCategory) {
  return ALGORITHM_CATEGORIES.find((c) => c.id === category)!.name;
}

export function algorithmsByCategory() {
  return ALGORITHM_CATEGORIES.map((category) => ({
    ...category,
    algorithms: ALGORITHMS.filter((a) => a.category === category.id),
  }));
}
