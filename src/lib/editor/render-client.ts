import type { Pixels } from "./pixels";
import type { EditorSettings } from "./settings";
import type { WorkerRequest, WorkerResponse } from "./render.worker";

type Pending = {
  resolve: (pixels: Pixels) => void;
  reject: (error: Error) => void;
};

/**
 * Runs the image pipeline off the main thread. Requests are queued by the
 * worker in order; callers decide which results are still relevant.
 * Falls back to the main thread when Workers are unavailable.
 */
export class RenderClient {
  private worker: Worker | null = null;
  private source: Pixels | null = null;
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
      this.pending.delete(data.id);
      if (data.type === "done") request.resolve(data.result);
      else request.reject(new Error(data.message));
    };
  }

  setSource(source: Pixels) {
    this.source = source;
    this.post({ type: "source", source });
  }

  async render(settings: EditorSettings, dither: boolean): Promise<Pixels> {
    if (!this.worker) {
      if (!this.source) throw new Error("No source image");
      const { renderPixels } = await import("./pipeline");
      return renderPixels(this.source, settings, { dither });
    }

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.post({ type: "render", id, settings, dither });
    });
  }

  dispose() {
    this.worker?.terminate();
    this.pending.forEach(({ reject }) =>
      reject(new Error("Renderer disposed")),
    );
    this.pending.clear();
  }

  private post(message: WorkerRequest) {
    this.worker?.postMessage(message);
  }
}
