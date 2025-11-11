"use client";

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

export default function EditorPage() {
  const { editorState } = useImageContext();
  const isMobile = useIsMobile();

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
        <main className="gap-4 lg:h-full">
          {!isMobile && (
            <div className="flex h-full flex-col">
              {editorState === EditorState.Initial && <InputFile />}
              {editorState !== EditorState.Initial && <Canvas />}
              <CanvasController />
            </div>
          )}
          {isMobile && (
            <div className="flex flex-col">
              {editorState === EditorState.Initial && <InputFile />}
              {editorState !== EditorState.Initial && <Canvas />}
              <CanvasController />
              <MobileEditorPanel />
            </div>
          )}
        </main>
      </div>
    </BreadcrumbProvider>
  );
}
