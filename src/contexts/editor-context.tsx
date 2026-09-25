"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { SourceImage } from "@/lib/editor/load-image";
import { RenderClient } from "@/lib/editor/render-client";
import { DEFAULT_SETTINGS, type EditorSettings } from "@/lib/editor/settings";

/**
 * - `empty`: no image loaded.
 * - `loaded`: image loaded; filter changes preview without dithering.
 * - `dithered`: dithering applied; every setting change re-renders.
 */
export type EditorStatus = "empty" | "loaded" | "dithered";

type EditorState = {
  status: EditorStatus;
  source: SourceImage | null;
  result: ImageBitmap | null;
  settings: EditorSettings;
  isRendering: boolean;
  error: string | null;
  /** Incremented to ask the provider to render with the current settings. */
  renderRequest: number;
};

type SettingsUpdate =
  | Partial<EditorSettings>
  | ((settings: EditorSettings) => Partial<EditorSettings>);

type Action =
  | { type: "load"; source: SourceImage }
  | { type: "discard" }
  | { type: "reset" }
  | { type: "update"; update: SettingsUpdate; render: boolean }
  | { type: "render" }
  | { type: "applyDither" }
  | { type: "renderStart" }
  | { type: "renderDone"; result: ImageBitmap }
  | { type: "renderFailed"; error: string }
  | { type: "setError"; error: string | null };

const initialState: EditorState = {
  status: "empty",
  source: null,
  result: null,
  settings: DEFAULT_SETTINGS,
  isRendering: false,
  error: null,
  renderRequest: 0,
};

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "load":
      return {
        ...initialState,
        settings: state.settings,
        status: "loaded",
        source: action.source,
        renderRequest: state.renderRequest,
      };
    case "discard":
      return { ...initialState, renderRequest: state.renderRequest };
    case "reset":
      return {
        ...state,
        status: state.source ? "loaded" : "empty",
        result: null,
        settings: DEFAULT_SETTINGS,
        isRendering: false,
        error: null,
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
    case "applyDither":
      return {
        ...state,
        status: "dithered",
        renderRequest: state.renderRequest + 1,
      };
    case "renderStart":
      return { ...state, isRendering: true, error: null };
    case "renderDone":
      return { ...state, isRendering: false, result: action.result };
    case "renderFailed":
      return { ...state, isRendering: false, error: action.error };
    case "setError":
      return { ...state, error: action.error };
  }
}

type EditorActions = {
  load: (source: SourceImage) => void;
  discard: () => void;
  reset: () => void;
  /** Change settings without rendering (e.g. while a slider is dragged). */
  update: (update: SettingsUpdate) => void;
  /** Change settings and render the result. */
  commit: (update?: SettingsUpdate) => void;
  applyDither: () => void;
  setError: (error: string | null) => void;
};

const EditorStateContext = createContext<EditorState | undefined>(undefined);
const EditorActionsContext = createContext<EditorActions | undefined>(
  undefined,
);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const latestRender = useRef(0);
  const renderer = useRef<RenderClient | null>(null);

  useEffect(() => {
    renderer.current = new RenderClient();
    return () => renderer.current?.dispose();
  }, []);

  const actions = useMemo<EditorActions>(() => {
    // Invalidate in-flight renders so they cannot publish over a new state.
    const cancelRenders = () => {
      latestRender.current += 1;
    };

    return {
      load: (source) => {
        cancelRenders();
        dispatch({ type: "load", source });
      },
      discard: () => {
        cancelRenders();
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
      applyDither: () => dispatch({ type: "applyDither" }),
      setError: (error) => dispatch({ type: "setError", error }),
    };
  }, []);

  const { renderRequest, source, status, settings, result } = state;

  // The worker keeps its own copy of the source pixels.
  useEffect(() => {
    if (source) renderer.current?.setSource(source.pixels);
    return () => source?.bitmap.close();
  }, [source]);

  // Free the previous result's GPU/bitmap memory once it's replaced.
  useEffect(() => () => result?.close(), [result]);

  // Renders run after the state update that requested them, so they always
  // see the latest settings. Only the most recent render may publish a result.
  useEffect(() => {
    if (renderRequest === 0 || !source || status === "empty") return;

    const id = ++latestRender.current;
    dispatch({ type: "renderStart" });

    renderer
      .current!.render(settings, status === "dithered")
      .then(({ data, width, height }) =>
        createImageBitmap(new ImageData(data, width, height)),
      )
      .then((result) => {
        if (id === latestRender.current) {
          dispatch({ type: "renderDone", result });
        } else {
          result.close();
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        if (id === latestRender.current) {
          dispatch({
            type: "renderFailed",
            error: "Rendering failed. Try a smaller image or another setting.",
          });
        }
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
