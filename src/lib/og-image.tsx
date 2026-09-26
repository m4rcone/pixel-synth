import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#120d0c";
const PAPER = "#ece4d6";
const PAPER_DIM = "#a0948a";
const SAFELIGHT = "#ee5140";

// Same cells as the logo mark (a 4×4 Bayer-dithered ramp).
const MARK = [
  [0, 0],
  [2, 0],
  [3, 0],
  [1, 1],
  [3, 1],
  [2, 2],
  [3, 2],
  [3, 3],
];

async function publicDataUrl(path: string) {
  const file = await readFile(join(process.cwd(), "public", path));
  return `data:image/png;base64,${file.toString("base64")}`;
}

/** Shared 1200×630 social card: title block on the left, a dithered print on the right. */
export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  image,
  imageSize = { width: 250, height: 250 },
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Path under /public of a preview image. */
  image: string;
  /** Intrinsic size of `image` (default 250×250); it's fitted into 500×500. */
  imageSize?: { width: number; height: number };
}) {
  const src = await publicDataUrl(image);
  const fit = 500 / Math.max(imageSize.width, imageSize.height);
  const drawn = {
    width: Math.round(imageSize.width * fit),
    height: Math.round(imageSize.height * fit),
  };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: INK,
        color: PAPER,
        padding: 64,
        gap: 56,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              position: "relative",
              display: "flex",
              border: `1.5px solid rgba(236,228,214,0.3)`,
              borderRadius: 6,
            }}
          >
            {MARK.map(([x, y]) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: 6 + x * 7,
                  top: 6 + y * 7,
                  width: 7,
                  height: 7,
                  background: PAPER,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 32, letterSpacing: -0.5 }}>PixelSynth</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 26, color: SAFELIGHT }}>{eyebrow}</div>
          <div
            style={{
              fontSize: title.length > 22 ? 64 : 80,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: PAPER_DIM,
              maxWidth: 560,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ fontSize: 24, color: PAPER_DIM }}>pixelsynth.art</div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={src}
        width={drawn.width}
        height={drawn.height}
        style={{
          alignSelf: "center",
          border: `1.5px solid rgba(236,228,214,0.26)`,
          borderRadius: 4,
          imageRendering: "pixelated",
        }}
      />
    </div>,
    OG_SIZE,
  );
}
