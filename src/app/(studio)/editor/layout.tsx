import type { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";
import { SidebarRight } from "@/components/sidebar-right";
import { SidebarInset } from "@/components/ui/sidebar";
import { absoluteUrl, siteConfig } from "@/lib/site";

const description =
  "Upload an image and transform it with interactive dithering controls, tone mapping, and browser-based rendering.";

export const metadata: Metadata = {
  title: "Editor",
  description,
  alternates: {
    canonical: "/editor",
  },
  openGraph: {
    title: `Editor | ${siteConfig.name}`,
    description,
    url: "/editor",
    images: [
      {
        url: siteConfig.previewImage,
        width: 250,
        height: 250,
        alt: "PixelSynth editor preview",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `Editor | ${siteConfig.name}`,
    description,
    images: [siteConfig.previewImage],
  },
};

const editorStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${siteConfig.name} Editor`,
    url: absoluteUrl("/editor"),
    description,
    applicationCategory: "MultimediaApplication",
    browserRequirements: "Requires a modern web browser",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    image: absoluteUrl(siteConfig.previewImage),
    creator: {
      "@type": "Person",
      name: siteConfig.creator,
      url: siteConfig.links.github,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
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
        name: "Editor",
        item: absoluteUrl("/editor"),
      },
    ],
  },
];

export default function EditorRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={editorStructuredData} />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="relative h-full overflow-hidden focus:outline-hidden lg:pr-80"
      >
        {children}
      </SidebarInset>
      <aside aria-label="Editor controls">
        <SidebarRight />
      </aside>
    </>
  );
}
