"use client";

import { useState } from "react";
import { InputFile } from "@/components/input-file";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { Canvas } from "@/components/canvas";
import { CanvasController } from "@/components/canvas-controller";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileEditorPanel } from "@/components/mobile-editor-panel";
import { GlobalHeader } from "@/components/global-header";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useEditorContext } from "@/contexts/editor-context";

export default function EditorPage() {
  const { editorState, baseImage, processedImage } = useImageContext();
  const { isRendering } = useEditorContext();
  const isMobile = useIsMobile();
  const [manualAnnouncement, setManualAnnouncement] = useState("");
  const announcement = isRendering
    ? "Rendering image."
    : manualAnnouncement ||
      (editorState === EditorState.Rendered && processedImage
        ? "Rendered image is ready."
        : baseImage
          ? "Image uploaded. Editor controls are now available."
          : "");

  return (
    <BreadcrumbProvider
      extra={
        <BreadcrumbItem>
          <BreadcrumbLink href="/editor">Editor</BreadcrumbLink>
        </BreadcrumbItem>
      }
    >
      <GlobalHeader />
      <div className="overflow-hidden pb-4 lg:h-[calc(100vh-3.5rem)] lg:pb-0">
        <h1 tabIndex={-1} className="sr-only">
          PixelSynth editor
        </h1>
        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </p>
        <section
          aria-label="Image editor workspace"
          className="gap-4 lg:h-full"
        >
          {!isMobile && (
            <div className="flex h-full flex-col">
              {editorState === EditorState.Initial && <InputFile />}
              {editorState !== EditorState.Initial && (
                <Canvas onStatusChange={setManualAnnouncement} />
              )}
              <CanvasController onStatusChange={setManualAnnouncement} />
            </div>
          )}
          {isMobile && (
            <div className="flex flex-col">
              {editorState === EditorState.Initial && <InputFile />}
              {editorState !== EditorState.Initial && (
                <Canvas onStatusChange={setManualAnnouncement} />
              )}
              <CanvasController onStatusChange={setManualAnnouncement} />
              <MobileEditorPanel />
            </div>
          )}
        </section>
      </div>
    </BreadcrumbProvider>
  );
}
