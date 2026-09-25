import type { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  absoluteUrl,
  breadcrumbStructuredData,
  pageMetadata,
  siteConfig,
} from "@/lib/site";

const description =
  "Upload an image and transform it with interactive dithering controls, tone mapping, and browser-based rendering.";

export const metadata: Metadata = pageMetadata({
  title: "Editor",
  description,
  path: "/editor",
});

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
  breadcrumbStructuredData([{ name: "Editor", path: "/editor" }]),
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
        className="relative min-h-svh focus:outline-hidden lg:h-svh lg:overflow-hidden"
      >
        {children}
      </SidebarInset>
    </>
  );
}
