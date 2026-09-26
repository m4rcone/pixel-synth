import Link from "next/link";
import { ALGORITHMS, getAlgorithm } from "@/lib/algorithms";
import { getPalettePreset, PALETTE_PRESETS } from "@/lib/palettes";
import { BUG_REPORT_URL, FEATURE_IDEA_URL } from "@/lib/feedback";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const algorithmLink = (slug: string) => ({
  label: getAlgorithm(slug)?.name ?? slug,
  href: `/algorithms/${slug}`,
});

const paletteLink = (id: string) => ({
  label: getPalettePreset(id)?.name ?? id,
  href: `/palettes#palette-${id}`,
});

const COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Editor",
    links: [
      { label: "Open the editor", href: "/editor" },
      { label: "Pixel art preset", href: "/editor?preset=pixel-art" },
      { label: "Try a sample", href: "/editor?sample=1" },
    ],
  },
  {
    title: "Algorithms",
    links: [
      algorithmLink("floyd-steinberg"),
      algorithmLink("atkinson"),
      algorithmLink("bayer-8-8"),
      { label: `All ${ALGORITHMS.length} algorithms`, href: "/algorithms" },
    ],
  },
  {
    title: "Palettes",
    links: [
      paletteLink("gameboy"),
      paletteLink("pico8"),
      paletteLink("cga-cyan-magenta"),
      { label: `All ${PALETTE_PRESETS.length} palettes`, href: "/palettes" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Suggest a feature", href: FEATURE_IDEA_URL, external: true },
      { label: "Report a bug", href: BUG_REPORT_URL, external: true },
      {
        label: "Source on GitHub",
        href: siteConfig.links.repository,
        external: true,
      },
    ],
  },
];

const linkClass =
  "text-paper-dim hover:text-paper focus-visible:ring-safelight rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

/** Site map footer for the landing and the catalog pages (not the editor). */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-line border-t pt-10 pb-7", className)}>
      <nav aria-label="Site map">
        <ul className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <li key={column.title} className="flex flex-col gap-3">
              <h2 className="text-label text-paper">{column.title}</h2>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-line text-paper-dim mt-10 flex flex-col gap-2 border-t pt-7 text-sm sm:flex-row sm:justify-between">
        <p>© 2026 PixelSynth — a dithering image editor</p>
        <p>Runs entirely in your browser.</p>
      </div>
    </footer>
  );
}
