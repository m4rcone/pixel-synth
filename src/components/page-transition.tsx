/// <reference types="react/canary" />
"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * Dissolves the next page in through a 4×4 Bayer mask on navigation (the
 * `dither-in` keyframes in globals.css). The boundary is keyed, so each
 * navigation mounts a fresh one: `enter` fires on route changes only, never
 * on in-page updates (sliders, Suspense reveals, query changes).
 *
 * - `area` (root layout): landing ↔ studio, the whole page dissolves.
 * - `page` (studio layout): studio ↔ studio, only the page; the sidebar
 *   stays put. Inside an area that is entering, React only animates the
 *   outermost boundary, so the two never stack.
 */
export function PageTransition({
  by,
  children,
}: {
  by: "area" | "page";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const key =
    by === "page" ? pathname : pathname === "/" ? "landing" : "studio";

  return (
    <ViewTransition
      key={key}
      enter="dither-in"
      exit="dither-out"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
