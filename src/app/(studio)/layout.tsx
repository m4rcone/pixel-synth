import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <aside aria-label="Primary navigation">
          <SidebarLeft />
        </aside>
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
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
