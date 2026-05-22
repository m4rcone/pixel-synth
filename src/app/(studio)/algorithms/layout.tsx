import { SidebarInset } from "@/components/ui/sidebar";

export default function AlgorithmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarInset
      id="main-content"
      tabIndex={-1}
      className="relative h-full overflow-hidden focus:outline-hidden"
    >
      {children}
    </SidebarInset>
  );
}
