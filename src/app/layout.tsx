import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Sixtyfour } from "next/font/google";
import { RouteFocusManager } from "@/components/route-focus-manager";
import { BRAND_COLORS } from "@/lib/brand";
import { siteConfig } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

// Display face for titles and large numbers; the SCAN axis draws the
// scanline inside the letter. The only preloaded font.
const sixtyfour = Sixtyfour({
  variable: "--font-sixtyfour",
  subsets: ["latin"],
  axes: ["SCAN"],
});

// Body, UI and readouts. Not preloaded: the fallback's size-adjust keeps the
// swap from shifting layout.
const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.creator, url: siteConfig.links.github }],
  creator: siteConfig.creator,
  publisher: siteConfig.name,
  category: "image editing",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  // Dark-only UI: the browser chrome matches the screen-black page.
  themeColor: BRAND_COLORS.ink,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sixtyfour.variable} ${azeretMono.variable}`}
    >
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="bg-ink-raised text-paper ring-safelight fixed top-3 left-3 z-50 -translate-y-20 border px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0 focus:ring-2 focus:outline-hidden"
        >
          Skip to content
        </a>
        <RouteFocusManager />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
