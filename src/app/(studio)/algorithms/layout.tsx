import type { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";
import { SidebarInset } from "@/components/ui/sidebar";
import algorithms from "@/data/algorithms.json";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { slugify } from "@/lib/slugify";

const description =
  "Explore the dithering algorithms available in PixelSynth and preview how each technique transforms an image.";

export const metadata: Metadata = {
  title: "Dithering Algorithms",
  description,
  alternates: {
    canonical: "/algorithms",
  },
  openGraph: {
    title: `Dithering Algorithms | ${siteConfig.name}`,
    description,
    url: "/algorithms",
    images: [
      {
        url: siteConfig.previewImage,
        width: 250,
        height: 250,
        alt: "PixelSynth dithering algorithm preview",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `Dithering Algorithms | ${siteConfig.name}`,
    description,
    images: [siteConfig.previewImage],
  },
};

const algorithmsStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Dithering Algorithms | ${siteConfig.name}`,
    url: absoluteUrl("/algorithms"),
    description,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: algorithms.length,
      itemListElement: algorithms.map((algorithm, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(
          `/algorithms#algorithm-${slugify(algorithm.algorithm)}`,
        ),
        name: algorithm.algorithm,
        description: algorithm.description,
        image: absoluteUrl(algorithm.preview),
      })),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Algorithms",
        item: absoluteUrl("/algorithms"),
      },
    ],
  },
];

export default function AlgorithmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      className="relative h-full overflow-hidden focus:outline-hidden"
    >
      <StructuredData data={algorithmsStructuredData} />
      {children}
    </SidebarInset>
  );
}
