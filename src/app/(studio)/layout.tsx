import { PageTransition } from "@/components/page-transition";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CanvasProvider } from "@/contexts/canvas-context";
import { EditorProvider } from "@/contexts/editor-context";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The editor providers live here (not in editor/layout) so that navigating
  // between studio pages (e.g. Editor <-> Algorithms) keeps the uploaded image
  // and all adjustments instead of unmounting and resetting them.
  return (
    <CanvasProvider>
      <EditorProvider>
        <UnsavedChangesGuard />
        <SidebarProvider>
          <SidebarLeft />
          <PageTransition by="page">{children}</PageTransition>
        </SidebarProvider>
      </EditorProvider>
    </CanvasProvider>
  );
}
