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
