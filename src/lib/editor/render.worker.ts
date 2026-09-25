/// <reference lib="webworker" />

import { renderPixels, type RenderResult } from "./pipeline";
import type { Pixels } from "./pixels";
import type { EditorSettings } from "./settings";

export type WorkerRequest =
  | { type: "source"; source: Pixels }
  | { type: "render"; id: number; settings: EditorSettings; dither: boolean };

export type WorkerResponse =
  | { type: "done"; id: number; result: RenderResult }
  | { type: "error"; id: number; message: string };

// The source image lives in the worker, so each render only sends settings.
let source: Pixels | null = null;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "source") {
    source = message.source;
    return;
  }

  try {
    if (!source) throw new Error("No source image");
    const result = renderPixels(source, message.settings, {
      dither: message.dither,
    });
    const response: WorkerResponse = { type: "done", id: message.id, result };
    self.postMessage(response, [result.pixels.data.buffer]);
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      id: message.id,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
