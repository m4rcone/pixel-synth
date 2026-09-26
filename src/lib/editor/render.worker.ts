/// <reference lib="webworker" />

import { decodeAnimation, encodeAnimation, type Animation } from "./animation";
import { GifLimitError, TooManyColorsError } from "./gif/errors";
import {
  renderPixels,
  resolveAnimationPalette,
  type RenderResult,
} from "./pipeline";
import type { Pixels } from "./pixels";
import type { EditorSettings } from "./settings";

export type WorkerRequest =
  /** One frame for a still image, every frame for an animation. */
  | { type: "source"; frames: Pixels[] }
  /** Renders the frames listed in `order`, one message per frame. */
  | {
      type: "render";
      id: number;
      settings: EditorSettings;
      dither: boolean;
      order: number[];
    }
  | { type: "decode-gif"; id: number; bytes: Uint8Array<ArrayBuffer> }
  | {
      type: "encode-gif";
      id: number;
      frames: Pixels[];
      delays: number[];
      loop: number;
      factor: number;
    };

export type WorkerError =
  | { kind: "limit"; limit: GifLimitError["limit"]; max: number }
  | { kind: "colors" }
  | { kind: "other" };

export type WorkerResponse =
  | {
      type: "frame";
      id: number;
      index: number;
      result: RenderResult;
      done: number;
      total: number;
    }
  | { type: "done"; id: number }
  /** A newer render or source replaced this render before it finished. */
  | { type: "cancelled"; id: number }
  | { type: "decoded"; id: number; animation: Animation | null }
  | { type: "progress"; id: number; done: number; total: number }
  | { type: "encoded"; id: number; bytes: Uint8Array<ArrayBuffer> }
  | { type: "error"; id: number; message: string; error: WorkerError };

// The source frames live in the worker, so each render only sends settings.
let frames: Pixels[] = [];
// Only the latest render keeps going; older ones stop at their next frame.
let latestRender = 0;

// A macrotask tick, so messages that arrived meanwhile (a newer render)
// are handled between two frames.
const channel = new MessageChannel();
const ticks: (() => void)[] = [];
channel.port1.onmessage = () => ticks.shift()?.();
const tick = () =>
  new Promise<void>((resolve) => {
    ticks.push(resolve);
    channel.port2.postMessage(null);
  });

function post(response: WorkerResponse, transfer: Transferable[] = []) {
  self.postMessage(response, transfer);
}

function fail(id: number, error: unknown) {
  post({
    type: "error",
    id,
    message: error instanceof Error ? error.message : String(error),
    error:
      error instanceof GifLimitError
        ? { kind: "limit", limit: error.limit, max: error.max }
        : error instanceof TooManyColorsError
          ? { kind: "colors" }
          : { kind: "other" },
  });
}

async function render({
  id,
  settings,
  dither,
  order,
}: Extract<WorkerRequest, { type: "render" }>) {
  latestRender = id;
  const source = frames;
  if (!source.length) throw new Error("No source image");
  const animated = source.length > 1;
  // One palette for every frame ("From image" would differ per frame).
  const palette =
    animated && dither ? resolveAnimationPalette(source, settings) : undefined;

  for (let n = 0; n < order.length; n++) {
    if (n > 0) {
      await tick();
      if (latestRender !== id) return post({ type: "cancelled", id });
    }
    const index = order[n];
    const result = renderPixels(source[index], settings, { dither, palette });
    post(
      { type: "frame", id, index, result, done: n + 1, total: order.length },
      [result.pixels.data.buffer],
    );
  }
  post({ type: "done", id });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "source") {
    frames = message.frames;
    latestRender = 0;
    return;
  }

  try {
    switch (message.type) {
      case "render":
        await render(message);
        break;
      case "decode-gif": {
        const animation = decodeAnimation(message.bytes);
        post(
          { type: "decoded", id: message.id, animation },
          animation?.frames.map((frame) => frame.data.buffer) ?? [],
        );
        break;
      }
      case "encode-gif": {
        const { id, delays, loop, factor } = message;
        const bytes = encodeAnimation(
          message.frames,
          delays,
          loop,
          factor,
          (done, total) => post({ type: "progress", id, done, total }),
        );
        post({ type: "encoded", id, bytes }, [bytes.buffer]);
        break;
      }
    }
  } catch (error) {
    fail(message.id, error);
  }
};
