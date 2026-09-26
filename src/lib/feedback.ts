import type { EditorSettings } from "@/lib/editor/settings";
import { siteConfig } from "@/lib/site";

const repository = siteConfig.links.repository;

/** Bug report form (.github/ISSUE_TEMPLATE/bug.yml). */
export const BUG_REPORT_URL = `${repository}/issues/new?template=bug.yml`;

/** Ideas category of GitHub Discussions (.github/DISCUSSION_TEMPLATE/ideas.yml). */
export const FEATURE_IDEA_URL = `${repository}/discussions/new?category=ideas`;

type Size = { width: number; height: number };

export type BugReportContext = {
  settings: EditorSettings;
  status: "empty" | "loaded" | "dithered";
  /** Size of the loaded image, never its pixels or name. */
  source: Size | null;
  result: Size | null;
  userAgent: string;
};

const size = ({ width, height }: Size) => `${width} × ${height} px`;

/**
 * Plain-text summary of the editor state for a bug report. It describes the
 * settings and sizes only: no image data, file name or custom colors.
 */
export function bugReportContext({
  settings,
  status,
  source,
  result,
  userAgent,
}: BugReportContext) {
  const { color, filters } = settings;
  const colorLine =
    color.mode === "palette"
      ? `palette ${color.palette} (match by ${color.match})`
      : `1-bit, ${settings.colorCount} dot color${settings.colorCount > 1 ? "s" : ""}${settings.preserveLuminance ? ", shaded by brightness" : ""}`;

  return [
    `Status: ${status}`,
    `Algorithm: ${settings.algorithm}`,
    `Color: ${colorLine}`,
    `Processing scale: ${Math.round(settings.scale * 100)}%`,
    `Filters: brightness ${filters.brightness}, contrast ${filters.contrast}, noise ${filters.noise}, blur ${filters.blur}`,
    `Image: ${source ? size(source) : "none"}`,
    `Output: ${result ? size(result) : "none"}`,
    `Browser: ${userAgent}`,
  ].join("\n");
}

/** Bug report form pre-filled with the editor state. */
export function bugReportUrl(context: BugReportContext) {
  const params = new URLSearchParams({
    template: "bug.yml",
    context: bugReportContext(context),
  });
  return `${repository}/issues/new?${params}`;
}
