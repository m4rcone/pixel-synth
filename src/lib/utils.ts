import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about custom utilities so they are not mistaken for
// text colors and dropped when merged with one.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": ["text-label"] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove "#" if exists
  hex = hex.replace(/^#/, "");

  // Short format support (#fff)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  // Convert to values RGB
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
