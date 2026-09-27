import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PREVIEW_SIZE } from "@/lib/algorithms";
import { BRAND_COLORS as C, MARK_CELLS } from "@/lib/brand";

export const OG_SIZE = { width: 1200, height: 630 };

const PADDING = 64;
/** Image bounds; the ruler gutter and readout sit outside them. */
const IMAGE_BOX = 460;
const IMAGE_MAX_HEIGHT = 380;
const RULER = 14;
const GAP = 48;
/** Width of the text column. */
const COLUMN = OG_SIZE.width - PADDING * 2 - GAP - IMAGE_BOX - RULER;

// Chrome-only scanlines, as in the `scanlines` utility.
const SCANLINES =
  "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(207,230,255,0.045) 2px, rgba(207,230,255,0.045) 3px)";

/** Static instances of the site's fonts (next/og can't read variable ones). */
const fonts = Promise.all(
  [
    ["Sixtyfour", "Sixtyfour.ttf", 400],
    ["Azeret Mono", "AzeretMono-Regular.ttf", 400],
    ["Azeret Mono", "AzeretMono-SemiBold.ttf", 600],
  ].map(async ([name, file, weight]) => ({
    name: name as string,
    data: await readFile(
      join(process.cwd(), "src/assets/fonts", file as string),
    ),
    weight: weight as 400 | 600,
    style: "normal" as const,
  })),
);

async function publicDataUrl(path: string) {
  const file = await readFile(join(process.cwd(), "public", path));
  return `data:image/png;base64,${file.toString("base64")}`;
}

/**
 * Sixtyfour is monospaced at 1 em per character: size the title so its
 * widest unbreakable run fits the column — each line when the title comes
 * in explicit lines, otherwise each word, since it wraps at spaces.
 */
function titleSize(lines: string[]) {
  const runs = lines.length > 1 ? lines : lines[0].split(" ");
  const widest = Math.max(...runs.map((run) => run.length));
  return Math.max(26, Math.min(56, Math.floor(COLUMN / widest)));
}

/** Ticks every `step` px along one side, like the hero's rulers. */
function ruler(direction: "x" | "y", length: number, step: number) {
  const angle = direction === "x" ? "90deg" : "180deg";
  return {
    [direction === "x" ? "width" : "height"]: length,
    [direction === "x" ? "height" : "width"]: 7,
    backgroundImage: `repeating-linear-gradient(${angle}, ${C.paperDim} 0px, ${C.paperDim} 1px, transparent 1px, transparent ${step}px)`,
  };
}

/**
 * Shared 1200×630 social card in the console identity: status bar, eyebrow,
 * Sixtyfour title and subtitle on the left; a dithered image in rulers on
 * the neutral well on the right, with a readout under it.
 */
export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  image,
  imageSize = { width: PREVIEW_SIZE, height: PREVIEW_SIZE },
  caption,
}: {
  eyebrow: string;
  /** Lines of the title; a single line wraps at spaces. */
  title: string | string[];
  subtitle: string;
  /** Path under /public of a preview image. */
  image: string;
  /** Intrinsic size of `image` (default: an algorithm specimen). */
  imageSize?: { width: number; height: number };
  /** Readout under the image, e.g. "Atkinson · 1-bit". */
  caption: string;
}) {
  const [src, fontData] = await Promise.all([publicDataUrl(image), fonts]);
  const lines = Array.isArray(title) ? title : [title];
  const fit = Math.min(
    IMAGE_BOX / imageSize.width,
    IMAGE_MAX_HEIGHT / imageSize.height,
  );
  const drawn = {
    width: Math.round(imageSize.width * fit),
    height: Math.round(imageSize.height * fit),
  };
  const titlePx = titleSize(lines);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.ink,
        backgroundImage: SCANLINES,
        color: C.paper,
        fontFamily: "Azeret Mono",
        padding: `${PADDING - 16}px ${PADDING}px ${PADDING}px`,
      }}
    >
      {/* Status bar, as in the site header. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 18,
          borderBottom: `1.5px solid ${C.lineStrong}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              position: "relative",
              display: "flex",
              border: `1.5px solid ${C.lineStrong}`,
            }}
          >
            {MARK_CELLS.map(([x, y]) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: 5 + x * 6,
                  top: 5 + y * 6,
                  width: 6,
                  height: 6,
                  background: C.paper,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: 4 }}>
            PIXELSYNTH
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 18,
            letterSpacing: 3,
            color: C.paperDim,
          }}
        >
          <div style={{ width: 12, height: 12, background: C.safelight }} />
          LOCAL · 0 UPLOADS
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: GAP,
          paddingTop: 24,
        }}
      >
        <div
          style={{
            width: COLUMN,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.safelight,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Sixtyfour",
              fontSize: titlePx,
              lineHeight: 1.15,
              textShadow: "0 0 0.3em rgba(207,230,255,0.45)",
            }}
          >
            {lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div style={{ fontSize: 22, lineHeight: 1.5, color: C.paperDim }}>
            {subtitle}
          </div>
        </div>

        {/* The image in rulers on the neutral well, never under effects. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", paddingLeft: RULER }}>
            <div style={ruler("x", drawn.width, drawn.width / 16)} />
          </div>
          <div style={{ display: "flex", gap: RULER - 7 }}>
            <div style={ruler("y", drawn.height, drawn.height / 12)} />
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img
              src={src}
              width={drawn.width}
              height={drawn.height}
              style={{
                background: C.inkSunken,
                outline: `1.5px solid ${C.lineStrong}`,
                imageRendering: "pixelated",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: drawn.width + RULER,
              paddingLeft: RULER,
              fontSize: 16,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: C.paperDim,
            }}
          >
            <div>{caption}</div>
          </div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: fontData },
  );
}
