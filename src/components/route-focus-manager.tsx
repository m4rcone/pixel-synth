"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteFocusManager() {
  const pathname = usePathname();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    requestAnimationFrame(() => {
      // A link to an anchor (e.g. /palettes#palette-pico8) lands on it.
      const anchor = window.location.hash
        ? document.getElementById(
            decodeURIComponent(window.location.hash.slice(1)),
          )
        : null;
      if (anchor) {
        if (!anchor.hasAttribute("tabindex")) anchor.tabIndex = -1;
        anchor.focus({ preventScroll: false });
        return;
      }

      const main = document.getElementById("main-content");
      const heading = main?.querySelector<HTMLElement>("h1");
      const target = heading ?? main;

      target?.focus({ preventScroll: false });
    });
  }, [pathname]);

  return null;
}
