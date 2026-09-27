import type { Animation } from "./animation";
import { GifLimitError, TooManyColorsError } from "./gif/errors";
import type { RenderResult } from "./pipeline";
import type { Pixels } from "./pixels";
import type { EditorSettings } from "./settings";
import type {
  WorkerError,
  WorkerRequest,
  WorkerResponse,
} from "./render.worker";

/** A render replaced by a newer one (or a new source) before it finished. */
export class RenderCancelledError extends Error {}

type FrameCallback = (
  index: number,
  result: RenderResult,
  done: number,
  total: number,
) => void;

type Pending = {
  resolve: (value: never) => void;
  reject: (error: Error) => void;
  onFrame?: FrameCallback;
  onProgress?: (done: number, total: number) => void;
};

function toError({ message, error }: { message: string; error: WorkerError }) {
  if (error.kind === "limit") return new GifLimitError(error.limit, error.max);
  if (error.kind === "colors") return new TooManyColorsError(message);
  return new Error(message);
}

/**
 * Runs the image pipeline off the main thread. Renders are cooperative: a
 * new render stops an animation render that is still going (its promise
 * rejects with {@link RenderCancelledError}); callers decide which results
 * are still relevant. Falls back to the main thread when Workers are
 * unavailable.
 */
export class RenderClient {
  private worker: Worker | null = null;
  private frames: Pixels[] = [];
  private pending = new Map<number, Pending>();
  private nextId = 1;

  constructor() {
    if (typeof Worker === "undefined") return;
    this.worker = new Worker(new URL("./render.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const request = this.pending.get(data.id);
      if (!request) return;
      switch (data.type) {
        case "frame":
          request.onFrame?.(data.index, data.result, data.done, data.total);
          return;
        case "progress":
          request.onProgress?.(data.done, data.total);
          return;
      }
      this.pending.delete(data.id);
      switch (data.type) {
        case "done":
          return request.resolve(undefined as never);
        case "decoded":
          return request.resolve(data.animation as never);
        case "encoded":
          return request.resolve(data.bytes as never);
        case "cancelled":
          return request.reject(new RenderCancelledError("Render replaced"));
        case "error":
          return request.reject(toError(data));
      }
    };
    // A worker that fails to load or crashes never answers: fail what it
    // was doing and render on the main thread from now on.
    this.worker.onerror = (event) => {
      console.error("Render worker failed", event.message || event);
      this.worker?.terminate();
      this.worker = null;
      this.rejectPending(new Error("Render worker failed"));
    };
  }

  /** One frame for a still image, every frame for an animation. */
  setSource(frames: Pixels[]) {
    this.frames = frames;
    this.post({ type: "source", frames });
  }

  /** Renders one frame (the only one of a still image). */
  async render(
    settings: EditorSettings,
    dither: boolean,
    frame = 0,
  ): Promise<RenderResult> {
    let result: RenderResult | null = null;
    await this.renderFrames(settings, dither, [frame], (_, r) => (result = r));
    return result!;
  }

  /**
   * Renders the frames listed in `order`, calling `onFrame` as each one is
   * ready. Every frame of an animation shares one palette.
   */
  async renderFrames(
    settings: EditorSettings,
    dither: boolean,
    order: number[],
    onFrame: FrameCallback,
  ): Promise<void> {
    if (!this.worker) {
      if (!this.frames.length) throw new Error("No source image");
      const { renderPixels, resolveAnimationPalette } =
        await import("./pipeline");
      const palette =
        this.frames.length > 1 && dither
          ? resolveAnimationPalette(this.frames, settings)
          : undefined;
      order.forEach((index, n) =>
        onFrame(
          index,
          renderPixels(this.frames[index], settings, { dither, palette }),
          n + 1,
          order.length,
        ),
      );
      return;
    }
    return this.request(
      (id) => ({ type: "render", id, settings, dither, order }),
      [],
      { onFrame },
    );
  }

  /**
   * Decodes an animated GIF (scaled to the animation limits), or null when
   * it has a single frame. Throws a {@link GifLimitError} past the limits.
   */
  async decodeAnimation(
    bytes: Uint8Array<ArrayBuffer>,
  ): Promise<Animation | null> {
    if (!this.worker) {
      const { decodeAnimation } = await import("./animation");
      return decodeAnimation(bytes);
    }
    return this.request(
      (id) => ({ type: "decode-gif", id, bytes }),
      [bytes.buffer],
    );
  }

  /** Encodes rendered frames as an animated GIF, enlarged `factor` times. */
  async encodeGif(
    frames: Pixels[],
    delays: number[],
    loop: number,
    factor: number,
    onProgress?: (done: number, total: number) => void,
  ): Promise<Uint8Array<ArrayBuffer>> {
    if (!this.worker) {
      const { encodeAnimation } = await import("./animation");
      return encodeAnimation(frames, delays, loop, factor, onProgress);
    }
    return this.request(
      (id) => ({ type: "encode-gif", id, frames, delays, loop, factor }),
      frames.map((frame) => frame.data.buffer),
      { onProgress },
    );
  }

  dispose() {
    this.worker?.terminate();
    // Later calls fall back to the main thread instead of hanging.
    this.worker = null;
    this.rejectPending(new Error("Renderer disposed"));
  }

  private rejectPending(error: Error) {
    this.pending.forEach(({ reject }) => reject(error));
    this.pending.clear();
  }

  private request<T>(
    message: (id: number) => WorkerRequest,
    transfer: Transferable[],
    callbacks: Pick<Pending, "onFrame" | "onProgress"> = {},
  ): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (value: never) => void,
        reject,
        ...callbacks,
      });
      this.worker!.postMessage(message(id), transfer);
    });
  }

  private post(message: WorkerRequest) {
    this.worker?.postMessage(message);
  }
}
