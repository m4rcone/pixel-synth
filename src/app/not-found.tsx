import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="scanlines relative flex min-h-svh flex-col overflow-x-clip">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-8">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col justify-center gap-7 py-16 focus:outline-hidden lg:py-24"
        >
          <h1
            tabIndex={-1}
            className="font-display text-display font-normal focus:outline-hidden"
          >
            <span className="text-safelight tracking-caps mb-5 block font-sans text-sm font-semibold uppercase">
              Error 404
            </span>
            <span className="text-glow block">No signal.</span>
          </h1>
          <p className="text-paper-dim max-w-md text-lg leading-relaxed">
            This page doesn’t exist or has moved. The editor, the algorithms and
            the palettes are where they’ve always been.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/editor">Open the editor</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/algorithms">Algorithms</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/palettes">Palettes</Link>
            </Button>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
