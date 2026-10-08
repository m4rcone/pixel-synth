import Link from "next/link";
import { Logo } from "@/components/logo";
import { focusRing } from "@/components/ui/link-styles";

const navLink = `text-caps px-2 py-1.5 text-paper-dim transition-colors hover:text-paper-hot ${focusRing}`;

/** Sticky header of the pages outside the studio: the landing and the 404. */
export function SiteHeader() {
  return (
    <header className="border-line bg-ink/90 sticky top-0 z-20 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="PixelSynth home" className={focusRing}>
          <Logo wordmarkClassName="max-sm:sr-only" />
        </Link>
        <nav aria-label="Primary" className="flex items-center sm:gap-2">
          <Link href="/editor" className={navLink}>
            Editor
          </Link>
          <Link href="/algorithms" className={navLink}>
            Algorithms
          </Link>
          <Link href="/palettes" className={navLink}>
            Palettes
          </Link>
        </nav>
        <p className="text-caps text-paper-dim flex items-center gap-2 max-lg:hidden">
          <span aria-hidden="true" className="bg-safelight size-2" />
          Local · 0 uploads
        </p>
      </div>
    </header>
  );
}
