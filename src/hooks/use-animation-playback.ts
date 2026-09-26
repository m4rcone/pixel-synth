"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasContext } from "@/contexts/canvas-context";
import { useEditorState } from "@/contexts/editor-context";

/** Longest catch-up after the tab was hidden or the page stalled, in ms. */
const MAX_STEP_MS = 1000;

/**
 * Plays the loaded animation while `playing`, with the GIF's own frame
 * delays and loop count (a finite loop stops on the last frame). Mount once,
 * in the canvas.
 */
export function useAnimationPlayback() {
  const { source } = useEditorState();
  const { frame, setFrame, playing, setPlaying } = useCanvasContext();
  const animation = source?.animation;
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    if (!animation || !playing) return;
    const { delays, loop } = animation;
    const last = delays.length - 1;
    let current = frameRef.current;
    let elapsed = 0;
    let plays = 0;
    let previous = performance.now();
    let request = requestAnimationFrame(function tick(now) {
      elapsed += Math.min(MAX_STEP_MS, now - previous);
      previous = now;
      let next = current;
      while (elapsed >= delays[next]) {
        elapsed -= delays[next];
        if (next === last) {
          plays++;
          if (loop !== 0 && plays >= loop) {
            setFrame(last);
            setPlaying(false);
            return;
          }
          next = 0;
        } else {
          next++;
        }
      }
      if (next !== current) {
        current = next;
        setFrame(next);
      }
      request = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(request);
  }, [animation, playing, setFrame, setPlaying]);
}

/** Frame and play state of the loaded animation, and ways to change them. */
export function useAnimationControls() {
  const { source } = useEditorState();
  const { frame, setFrame, playing, setPlaying } = useCanvasContext();
  const animation = source?.animation;
  const count = animation?.frames.length ?? 1;

  const togglePlaying = useCallback(() => {
    if (!animation) return;
    // A finished finite animation starts over.
    if (!playing && animation.loop !== 0 && frame === count - 1) setFrame(0);
    setPlaying(!playing);
  }, [animation, playing, frame, count, setFrame, setPlaying]);

  /** Pauses and moves `delta` frames, wrapping around. */
  const step = useCallback(
    (delta: number) => {
      if (!animation) return frame;
      const next = (((frame + delta) % count) + count) % count;
      setPlaying(false);
      setFrame(next);
      return next;
    },
    [animation, frame, count, setFrame, setPlaying],
  );

  return {
    animation,
    count,
    frame,
    playing,
    togglePlaying,
    step,
    setFrame,
    setPlaying,
  };
}

/** "Frame 12 of 80". */
export function frameLabel(frame: number, count: number) {
  return `Frame ${frame + 1} of ${count}`;
}
