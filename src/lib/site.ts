export const siteConfig = {
  name: "PixelSynth",
  title: "PixelSynth - Dithering Image Editor",
  url: "https://pixelsynth.art",
  description:
    "Transform images into algorithmic art using real dithering techniques. Experiment, compare, and synth your pixels.",
  creator: "m4rcone",
  previewImage: "/250/pixel-synth.png",
  links: {
    github: "https://github.com/m4rcone",
  },
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
