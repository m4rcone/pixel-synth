import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ImageProvider } from "@/contexts/image-context";
import { CanvasProvider } from "@/contexts/canvas-context";
import { EditorProvider } from "@/contexts/editor-context";
import { RouteFocusManager } from "@/components/route-focus-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelSynth",
  description:
    "Transform images into algorithmic art using real dithering techniques. Experiment, compare, and synth your pixels.",
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
          <ImageProvider>
            <CanvasProvider>
              <EditorProvider>{children}</EditorProvider>
            </CanvasProvider>
          </ImageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
