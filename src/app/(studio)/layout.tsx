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
        <SidebarLeft />
        <SidebarInset className="relative h-full overflow-hidden lg:pr-80">
          {children}
        </SidebarInset>
        <SidebarRight />
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
