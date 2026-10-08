/**
 * Product events for Google Analytics. `gtag` only exists once the visitor
 * accepts analytics (and only on production deploys), so before that, after
 * declining, and in previews and tests every call does nothing. Parameters
 * describe what was done, never the image: no pixels, file names or colors.
 * Outbound clicks (Ko-fi, GitHub) are already counted by GA's enhanced
 * measurement.
 */
type Events = {
  image_loaded: {
    source: "upload" | "paste" | "sample" | "sample_animated";
    animated: boolean;
  };
  export: { format: "png" | "gif"; scale: number };
  share_link_copied: Record<string, never>;
  preset_applied: { preset: string };
};

export function track<Name extends keyof Events>(
  name: Name,
  params: Events[Name],
) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
