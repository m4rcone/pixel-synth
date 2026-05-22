import type { MetadataRoute } from "next";
import algorithms from "@/data/algorithms.json";
import { absoluteUrl } from "@/lib/site";

const algorithmPreviewImages = algorithms.map((algorithm) =>
  absoluteUrl(algorithm.preview),
);

const routes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
    images: [absoluteUrl("/250/pixel-synth.png")],
  },
  {
    path: "/editor",
    changeFrequency: "monthly",
    priority: 0.8,
    images: [absoluteUrl("/250/pixel-synth.png")],
  },
  {
    path: "/algorithms",
    changeFrequency: "monthly",
    priority: 0.7,
    images: algorithmPreviewImages,
  },
] satisfies Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  images?: string[];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    images: route.images,
  }));
}
