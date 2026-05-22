import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <aside aria-label="Primary navigation">
        <SidebarLeft />
      </aside>
      {children}
    </SidebarProvider>
  );
}
