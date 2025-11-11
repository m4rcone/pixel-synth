import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ImageProvider } from "@/contexts/image-context";
import { CanvasProvider } from "@/contexts/canvas-context";
import { EditorProvider } from "@/contexts/editor-context";

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
