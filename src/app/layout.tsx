import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteFocusManager } from "@/components/route-focus-manager";
import { siteConfig } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    images: [
      {
        url: siteConfig.previewImage,
        width: 250,
        height: 250,
        alt: "PixelSynth dithering preview",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.previewImage],
  },
};

export const viewport: Viewport = {
  // Dark-first UI (default theme is dark and the landing page is always dark),
  // so the browser chrome matches the darkroom background.
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="bg-background text-foreground ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-transform focus:translate-y-0 focus:ring-2 focus:outline-hidden"
          >
            Skip to content
          </a>
          <RouteFocusManager />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
