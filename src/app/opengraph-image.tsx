import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { siteConfig } from "@/lib/site";

export const alt = "PixelSynth — a sphere dithered with Floyd–Steinberg";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "In-browser dithering lab",
    title: "Smooth in. Dither out.",
    subtitle: siteConfig.description,
    image: siteConfig.previewImage,
  });
}
