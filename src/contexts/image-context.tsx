"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import { EditorState } from "@/lib/enum/editor-state";

type ImageContextValue = {
  editorState: EditorState;
  setEditorState: Dispatch<SetStateAction<EditorState>>;
  baseImage: HTMLImageElement | null;
  setBaseImage: Dispatch<SetStateAction<HTMLImageElement | null>>;
  processedImage: HTMLImageElement | null;
  setProcessedImage: Dispatch<SetStateAction<HTMLImageElement | null>>;
};

const ImageContext = createContext<ImageContextValue | undefined>(undefined);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [editorState, setEditorState] = useState(EditorState.Initial);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [processedImage, setProcessedImage] = useState<HTMLImageElement | null>(
    null,
  );

  return (
    <ImageContext.Provider
      value={{
        editorState,
        setEditorState,
        baseImage,
        setBaseImage,
        processedImage,
        setProcessedImage,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImageContext must be used within an ImageProvider");
  }
  return context;
}
