"use client";

import dynamic from "next/dynamic";
import "../styles/background.css";
import type { DitherProps } from "./background-dither";

const LazyBackgroundDither = dynamic(
  () =>
    import("./background-dither").then((mod) => ({
      default: mod.BackgroundDither,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        role="presentation"
        className="dither-container bg-background"
      />
    ),
  },
);

export function BackgroundDitherLoader(props: DitherProps) {
  return <LazyBackgroundDither {...props} />;
}
