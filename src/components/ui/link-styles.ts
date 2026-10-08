/** Safelight outline on keyboard focus, for links and custom controls. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-safelight";

/** Underlined inline link, white on hover. */
export const textLink = `text-paper hover:text-paper-hot hover:decoration-paper-hot decoration-line-strong underline underline-offset-4 transition-colors ${focusRing}`;
