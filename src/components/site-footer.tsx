import Link from "next/link";
import { ALGORITHMS } from "@/lib/algorithms";
import { PALETTE_PRESETS } from "@/lib/palettes";
import { BUG_REPORT_URL, FEATURE_IDEA_URL } from "@/lib/feedback";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Editor",
    links: [
      { label: "Open the editor", href: "/editor" },
      { label: "Try the sample", href: "/editor?sample=1" },
      { label: "Try an animated GIF", href: "/editor?sample=animated" },
      { label: "Pixel art preset", href: "/editor?preset=pixel-art" },
    ],
  },
  {
    title: `${ALGORITHMS.length} algorithms`,
    links: ALGORITHMS.map((algorithm) => ({
      label: algorithm.shortName,
      href: `/algorithms/${algorithm.slug}`,
    })),
  },
  {
    title: `${PALETTE_PRESETS.length} palettes`,
    links: PALETTE_PRESETS.map((palette) => ({
      label: palette.name,
      href: `/palettes#palette-${palette.id}`,
    })),
  },
  {
    title: "About",
    links: [
      {
        label: "Source on GitHub",
        href: siteConfig.links.repository,
        external: true,
      },
      { label: "Suggest a feature", href: FEATURE_IDEA_URL, external: true },
      { label: "Report a bug", href: BUG_REPORT_URL, external: true },
      {
        label: "Support on Ko-fi",
        href: siteConfig.links.support,
        external: true,
      },
    ],
  },
];

const linkClass =
  "text-paper-dim hover:text-paper-hot focus-visible:ring-safelight  text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none";

/**
 * Site index for the landing and the catalog pages (not the editor): every
 * algorithm and palette, so each page links to all of them.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-line border-t pt-10 pb-7", className)}>
      <nav aria-label="Site map">
        <ul className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <li key={column.title} className="flex flex-col gap-3">
              {/* A column title, not a heading: the site map stays out of
                  each page's outline. */}
              <p className="text-caps text-paper">{column.title}</p>
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
        <p>© 2026 PixelSynth: Dithering & Pixel Art Tool</p>
        <p>
          Free, no ads, runs in your browser.{" "}
          <a
            href={siteConfig.links.support}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkClass, "text-paper")}
          >
            Buy me a coffee →
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
