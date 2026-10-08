"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useCanvasContext } from "@/contexts/canvas-context";
import { prefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { loadImageFile, type SourceImage } from "@/lib/editor/load-image";
import { HEX_COLOR, type Pixels } from "@/lib/editor/pixels";
import { RenderCancelledError, RenderClient } from "@/lib/editor/render-client";
import { DEFAULT_SETTINGS, type EditorSettings } from "@/lib/editor/settings";
import { track } from "@/lib/track";

/**
 * - `empty`: no image loaded.
 * - `ready`: image loaded and rendered on arrival; every committed setting
 *   change re-renders.
 */
export type EditorStatus = "empty" | "ready";

type EditorState = {
  status: EditorStatus;
  source: SourceImage | null;
  /**
   * Rendered image at native resolution (smaller than the source when
   * scaled). For an animation, the frame `resultIndex`.
   */
  result: ImageBitmap | null;
  /** Frame of an animation that `result` shows. */
  resultIndex: number;
  /**
   * Every rendered frame of a dithered animation, filled in as the frames
   * arrive (a frame keeps its previous render until then, or is null).
   */
  resultFrames: (ImageBitmap | null)[] | null;
  /** Colors the last palette render used (resolves "From image"). */
  resultPalette: string[] | null;
  settings: EditorSettings;
  isRendering: boolean;
  /** Frames rendered so far while a whole animation renders. */
  renderProgress: { done: number; total: number } | null;
  error: string | null;
  /** Incremented to ask the provider to render with the current settings. */
  renderRequest: number;
};

type SettingsUpdate =
  | Partial<EditorSettings>
  | ((settings: EditorSettings) => Partial<EditorSettings>);

/**
 * Settings to apply together with the next image loaded, sized for it (the
 * pixel art preset of a `?preset=` link). `name` is reported to analytics.
 */
export type NextLoadSettings = {
  name: string;
  settings: (
    settings: EditorSettings,
    size: { width: number; height: number },
  ) => Partial<EditorSettings>;
};

type Action =
  | { type: "load"; source: SourceImage; next: NextLoadSettings | null }
  | { type: "discard" }
  | { type: "reset" }
  | { type: "update"; update: SettingsUpdate; render: boolean }
  | { type: "render" }
  | { type: "renderStart" }
  | {
      type: "renderDone";
      result: ImageBitmap;
      index: number;
      palette: string[] | null;
    }
  | {
      type: "framesRendered";
      frames: [index: number, bitmap: ImageBitmap][];
      /** The frame shown when the render started; it becomes `result`. */
      shown: number;
      palette: string[] | null;
      progress: { done: number; total: number } | null;
    }
  | { type: "renderFailed"; error: string }
  | { type: "setError"; error: string | null };

const initialState: EditorState = {
  status: "empty",
  source: null,
  result: null,
  resultIndex: 0,
  resultFrames: null,
  resultPalette: null,
  settings: DEFAULT_SETTINGS,
  isRendering: false,
  renderProgress: null,
  error: null,
  renderRequest: 0,
};

/** The user's own palette survives resets; it's saved like a document. */
function keepCustomPalette(
  next: EditorSettings,
  current: EditorSettings,
): EditorSettings {
  return { ...next, color: { ...next.color, custom: current.color.custom } };
}

const CUSTOM_PALETTE_KEY = "pixelsynth:custom-palette";

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "load": {
      const { width, height } = action.source.pixels;
      return {
        ...initialState,
        // Applied here, so the image's first render already uses them.
        settings: action.next
          ? {
              ...state.settings,
              ...action.next.settings(state.settings, { width, height }),
            }
          : state.settings,
        status: "ready",
        source: action.source,
        renderRequest: state.renderRequest + 1,
      };
    }
    case "discard":
      return {
        ...initialState,
        settings: keepCustomPalette(DEFAULT_SETTINGS, state.settings),
        renderRequest: state.renderRequest,
      };
    case "reset":
      return {
        ...state,
        settings: keepCustomPalette(DEFAULT_SETTINGS, state.settings),
        error: null,
        renderRequest: state.source
          ? state.renderRequest + 1
          : state.renderRequest,
      };
    case "update": {
      const partial =
        typeof action.update === "function"
          ? action.update(state.settings)
          : action.update;
      return {
        ...state,
        settings: { ...state.settings, ...partial },
        renderRequest: action.render
          ? state.renderRequest + 1
          : state.renderRequest,
      };
    }
    case "render":
      return { ...state, renderRequest: state.renderRequest + 1 };
    case "renderStart":
      return { ...state, isRendering: true, error: null };
    case "renderDone":
      return {
        ...state,
        isRendering: false,
        result: action.result,
        resultIndex: action.index,
        resultPalette: action.palette,
      };
    case "framesRendered": {
      const frames =
        state.resultFrames?.slice() ??
        Array<ImageBitmap | null>(
          state.source?.animation?.frames.length ?? 0,
        ).fill(null);
      let { result, resultIndex } = state;
      for (const [index, bitmap] of action.frames) {
        frames[index] = bitmap;
        if (index === action.shown) {
          result = bitmap;
          resultIndex = index;
        }
      }
      return {
        ...state,
        result,
        resultIndex,
        resultFrames: frames,
        resultPalette: action.palette,
        isRendering: action.progress !== null,
        renderProgress: action.progress,
      };
    }
    case "renderFailed":
      return {
        ...state,
        isRendering: false,
        renderProgress: null,
        error: action.error,
      };
    case "setError":
      return { ...state, error: action.error };
  }
}

type EditorActions = {
  /**
   * Decodes an image file for {@link EditorActions.load} (animated GIFs in
   * the render worker). Throws an ImageLoadError with a user-facing message.
   */
  readImage: (file: File) => Promise<SourceImage>;
  load: (source: SourceImage) => void;
  /** Sets (or with null, clears) settings for the next image loaded. */
  setNextLoadSettings: (next: NextLoadSettings | null) => void;
  discard: () => void;
  reset: () => void;
  /** Change settings without rendering (e.g. while a slider is dragged). */
  update: (update: SettingsUpdate) => void;
  /** Change settings and render the result. */
  commit: (update?: SettingsUpdate) => void;
  setError: (error: string | null) => void;
  /** Encodes rendered animation frames as a GIF in the render worker. */
  encodeGif: (
    frames: Pixels[],
    factor: number,
    onProgress?: (done: number, total: number) => void,
  ) => Promise<Uint8Array<ArrayBuffer>>;
};

/**
 * The processed image for a frame: the still result or an animation's
 * frame. Null when that frame has no render (yet).
 */
export function frameResult(
  { source, result, resultFrames }: EditorState,
  frame: number,
): ImageBitmap | null {
  if (!source?.animation) return result;
  return resultFrames?.[frame] ?? null;
}

const EditorStateContext = createContext<EditorState | undefined>(undefined);
const EditorActionsContext = createContext<EditorActions | undefined>(
  undefined,
);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const latestRender = useRef(0);
  const renderer = useRef<RenderClient | null>(null);
  const nextLoad = useRef<NextLoadSettings | null>(null);
  const { frame, setFrame, setPlaying } = useCanvasContext();
  // Read when a render starts, without re-running the render effect.
  const shownFrame = useRef(frame);
  useEffect(() => {
    shownFrame.current = frame;
  }, [frame]);

  // Started on first use: the studio's content pages share this provider and
  // never need the worker.
  const getRenderer = useCallback(
    () => (renderer.current ??= new RenderClient()),
    [],
  );
  useEffect(
    () => () => {
      renderer.current?.dispose();
      renderer.current = null;
    },
    [],
  );

  const actions = useMemo<EditorActions>(() => {
    // Invalidate in-flight renders so they cannot publish over a new state.
    const cancelRenders = () => {
      latestRender.current += 1;
    };

    return {
      readImage: (file) => loadImageFile(file, getRenderer()),
      load: (source) => {
        cancelRenders();
        shownFrame.current = 0;
        setFrame(0);
        // Playback starts paused for people who prefer reduced motion.
        setPlaying(!!source.animation && !prefersReducedMotion());
        const next = nextLoad.current;
        nextLoad.current = null;
        dispatch({ type: "load", source, next });
        if (next) track("preset_applied", { preset: next.name });
      },
      setNextLoadSettings: (next) => {
        nextLoad.current = next;
      },
      discard: () => {
        cancelRenders();
        setPlaying(false);
        dispatch({ type: "discard" });
      },
      reset: () => {
        cancelRenders();
        dispatch({ type: "reset" });
      },
      update: (update) => dispatch({ type: "update", update, render: false }),
      commit: (update) =>
        update
          ? dispatch({ type: "update", update, render: true })
          : dispatch({ type: "render" }),
      setError: (error) => dispatch({ type: "setError", error }),
      encodeGif: (frames, factor, onProgress) => {
        const animation = sourceRef.current?.animation;
        if (!animation) return Promise.reject(new Error("No animation"));
        return getRenderer().encodeGif(
          frames,
          animation.delays,
          animation.loop,
          factor,
          onProgress,
        );
      },
    };
  }, [getRenderer, setFrame, setPlaying]);

  const { renderRequest, source, status, settings, result, resultFrames } =
    state;
  const sourceRef = useRef(source);
  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  // Restore and persist the custom palette (per browser, best effort).
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CUSTOM_PALETTE_KEY) ?? "null",
      );
      if (
        Array.isArray(saved) &&
        saved.length >= 2 &&
        saved.every((c) => typeof c === "string" && HEX_COLOR.test(c))
      ) {
        dispatch({
          type: "update",
          update: (s) => ({ color: { ...s.color, custom: saved } }),
          render: false,
        });
      }
    } catch {
      // Storage unavailable: keep the default custom palette.
    }
  }, []);
  const customPalette = settings.color.custom;
  useEffect(() => {
    // The untouched default is never written: on mount this effect runs
    // before the restored palette lands, and would overwrite it.
    if (customPalette === DEFAULT_SETTINGS.color.custom) return;
    try {
      localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(customPalette));
    } catch {
      // Storage unavailable or full: the palette just won't persist.
    }
  }, [customPalette]);

  // The worker keeps its own copy of the source pixels (every frame).
  useEffect(() => {
    if (!source) return;
    getRenderer().setSource(source.animation?.frames ?? [source.pixels]);
    return () => {
      source.bitmap.close();
      source.animation?.bitmaps.forEach((bitmap) => bitmap.close());
    };
  }, [source, getRenderer]);

  // Free rendered bitmaps' GPU memory once no state refers to them (an
  // animation's `result` is also one of its `resultFrames`).
  const liveBitmaps = useRef(new Set<ImageBitmap>());
  useEffect(() => {
    const live = new Set<ImageBitmap>();
    if (result) live.add(result);
    resultFrames?.forEach((bitmap) => bitmap && live.add(bitmap));
    liveBitmaps.current.forEach((bitmap) => {
      if (!live.has(bitmap)) bitmap.close();
    });
    liveBitmaps.current = live;
  }, [result, resultFrames]);

  // Renders run after the state update that requested them, so they always
  // see the latest settings. Only the most recent render may publish a result.
  useEffect(() => {
    if (renderRequest === 0 || !source || status === "empty") return;

    const id = ++latestRender.current;
    const client = getRenderer();
    const animation = source.animation;
    const shown = animation ? shownFrame.current : 0;
    const isLatest = () => id === latestRender.current;
    const failed = (error: unknown) => {
      if (error instanceof RenderCancelledError) return;
      console.error(error);
      if (isLatest()) {
        dispatch({
          type: "renderFailed",
          error: "Rendering failed. Try a smaller image or another setting.",
        });
      }
    };
    dispatch({ type: "renderStart" });

    if (!animation) {
      client
        .render(settings)
        .then(async ({ pixels, palette }) => ({
          bitmap: await toBitmap(pixels),
          palette,
        }))
        .then(({ bitmap, palette }) => {
          if (isLatest()) {
            dispatch({
              type: "renderDone",
              result: bitmap,
              index: shown,
              palette,
            });
          } else {
            bitmap.close();
          }
        })
        .catch(failed);
      return;
    }

    // The whole animation, shown frame first so it updates at once. Frames
    // are published in batches to keep React renders few.
    const order = [shown];
    for (let i = 0; i < animation.frames.length; i++) {
      if (i !== shown) order.push(i);
    }
    let batch: [number, ImageBitmap][] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let palette: string[] | null = null;
    let progress = { done: 0, total: order.length };
    let conversions = Promise.resolve();
    const publish = (complete: boolean) => {
      clearTimeout(timer);
      timer = undefined;
      const frames = batch;
      batch = [];
      if (!isLatest()) return frames.forEach(([, bitmap]) => bitmap.close());
      dispatch({
        type: "framesRendered",
        frames,
        shown,
        palette,
        progress: complete ? null : progress,
      });
    };

    client
      .renderFrames(settings, order, (index, result, done, total) => {
        palette = result.palette;
        // Chained so frames publish in the order they were rendered.
        conversions = conversions.then(async () => {
          batch.push([index, await toBitmap(result.pixels)]);
          progress = { done, total };
          if (done === 1) publish(false);
          else timer ??= setTimeout(() => publish(false), FRAME_BATCH_MS);
        });
      })
      .then(() => conversions)
      .then(() => publish(true))
      .catch((error: unknown) => {
        void conversions.then(() => {
          clearTimeout(timer);
          batch.forEach(([, bitmap]) => bitmap.close());
          batch = [];
        });
        failed(error);
      });
    // Only an explicit render request triggers a render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderRequest]);

  return (
    <EditorActionsContext.Provider value={actions}>
      <EditorStateContext.Provider value={state}>
        {children}
      </EditorStateContext.Provider>
    </EditorActionsContext.Provider>
  );
}

/** How often frames of an animation render are published, in ms. */
const FRAME_BATCH_MS = 150;

function toBitmap({ data, width, height }: Pixels) {
  return createImageBitmap(new ImageData(data, width, height));
}

export function useEditorState() {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error("useEditorState must be used within an EditorProvider");
  }
  return context;
}

export function useEditorActions() {
  const context = useContext(EditorActionsContext);
  if (!context) {
    throw new Error("useEditorActions must be used within an EditorProvider");
  }
  return context;
}
