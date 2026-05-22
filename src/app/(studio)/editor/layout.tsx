import { SidebarRight } from "@/components/sidebar-right";
import { SidebarInset } from "@/components/ui/sidebar";
import { ImageProvider } from "@/contexts/image-context";
import { CanvasProvider } from "@/contexts/canvas-context";
import { EditorProvider } from "@/contexts/editor-context";

export default function EditorRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ImageProvider>
      <CanvasProvider>
        <EditorProvider>
          <SidebarInset
            id="main-content"
            tabIndex={-1}
            className="relative h-full overflow-hidden focus:outline-hidden lg:pr-80"
          >
            {children}
          </SidebarInset>
          <aside aria-label="Editor controls">
            <SidebarRight />
          </aside>
        </EditorProvider>
      </CanvasProvider>
    </ImageProvider>
  );
}
