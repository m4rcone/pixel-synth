"use client";

import { useEffect } from "react";

/** Gap between cards of one group revealing together. */
const STAGGER_MS = 60;
/** Count-up of the spec plate numbers. */
const COUNT_MS = 480;
const COUNT_FRAMES = 12;
/** Block sizes the pixel art preview resolves through, then native. */
const ENHANCE_BLOCKS = [12, 6, 3];
const ENHANCE_STEP_MS = 110;

/**
 * Landing scroll reveals. Blocks marked `data-reveal` that start below the
 * fold dissolve in through the Bayer mask once, when they scroll into view
 * (`.reveal-armed` → `.reveal-in`, globals.css). Inside a block:
 * - `data-reveal-group`: siblings revealing together enter 60 ms apart;
 * - `data-count`: the number counts up to its value (aria-hidden copy);
 * - `data-strip`: palette colors load one at a time (CSS only);
 * - `data-enhance`: the image resolves from coarse blocks to native.
 *
 * The server HTML is fully visible: only this effect hides anything, and only
 * below the fold. With reduced motion, nothing is hidden or animated.
 * Keyboard focus and printing reveal a block at once.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    // Drops the mask once the dissolve ends, so focus rings and anything
    // drawn outside the block are never clipped. Inner effects (the palette
    // strips) keep running.
    const settle = (event: AnimationEvent) => {
      const el = event.currentTarget as HTMLElement;
      if (event.target !== el) return;
      el.classList.add("reveal-done");
      el.removeEventListener("animationend", settle);
    };

    const countUp = (el: HTMLElement, delay: number) => {
      const to = Number(el.dataset.count);
      const width = String(to).length;
      el.textContent = "0".padStart(width, "0");
      for (let frame = 1; frame <= COUNT_FRAMES; frame++) {
        later(
          () => {
            el.textContent = String(
              Math.round((to * frame) / COUNT_FRAMES),
            ).padStart(width, "0");
          },
          delay + (frame * COUNT_MS) / COUNT_FRAMES,
        );
      }
      later(() => (el.textContent = String(to)), delay + COUNT_MS);
    };

    const enhance = (img: HTMLImageElement, delay: number) => {
      if (!img.complete || !img.naturalWidth) return;
      const { naturalWidth: w, naturalHeight: h } = img;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.setAttribute("aria-hidden", "true");
      canvas.className = "pixelated absolute inset-0 size-full";
      const ctx = canvas.getContext("2d");
      const small = document.createElement("canvas");
      const smallCtx = small.getContext("2d");
      if (!ctx || !smallCtx) return;
      ctx.imageSmoothingEnabled = false;

      const draw = (block: number) => {
        small.width = Math.max(1, Math.round(w / block));
        small.height = Math.max(1, Math.round(h / block));
        smallCtx.drawImage(img, 0, 0, small.width, small.height);
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, w, h);
      };

      draw(ENHANCE_BLOCKS[0]);
      img.parentElement?.append(canvas);
      ENHANCE_BLOCKS.slice(1).forEach((block, i) =>
        later(() => draw(block), delay + (i + 1) * ENHANCE_STEP_MS),
      );
      later(
        () => canvas.remove(),
        delay + ENHANCE_BLOCKS.length * ENHANCE_STEP_MS,
      );
    };

    // Cards of one group that reveal in the same observer callback stagger.
    const groupIndex = new Map<string, number>();

    const reveal = (el: HTMLElement) => {
      if (!el.classList.contains("reveal-armed")) return;
      const group = el.dataset.revealGroup;
      let delay = 0;
      if (group) {
        const index = groupIndex.get(group) ?? 0;
        groupIndex.set(group, index + 1);
        delay = index * STAGGER_MS;
      }
      el.style.setProperty("--reveal-delay", `${delay}ms`);
      el.addEventListener("animationend", settle);
      el.classList.add("reveal-in");

      el.querySelectorAll<HTMLElement>("[data-count]").forEach((count) =>
        countUp(count, delay),
      );
      el.querySelectorAll<HTMLImageElement>("img[data-enhance]").forEach(
        (img) => enhance(img, delay),
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        groupIndex.clear();
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          reveal(entry.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    const blocks = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    for (const el of blocks) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal-armed");
        observer.observe(el);
      }
    }

    const revealNow = (el: HTMLElement) => {
      observer.unobserve(el);
      el.classList.remove("reveal-armed", "reveal-in");
    };
    const onFocus = (event: FocusEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>(
        ".reveal-armed",
      );
      if (el) revealNow(el);
    };
    const onPrint = () =>
      document
        .querySelectorAll<HTMLElement>(".reveal-armed")
        .forEach(revealNow);
    document.addEventListener("focusin", onFocus);
    window.addEventListener("beforeprint", onPrint);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("beforeprint", onPrint);
      for (const el of blocks) {
        el.classList.remove("reveal-armed", "reveal-in", "reveal-done");
        el.removeEventListener("animationend", settle);
      }
    };
  }, []);

  return null;
}
