"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                data-active={isActive}
                className="data-[active=true]:bg-sidebar-accent h-9"
              >
                <Link
                  href={item.url}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                  className={`relative flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "hover:text-foreground text-paper-dim"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`bg-safelight absolute top-1/2 -left-2 h-4 w-0.5 -translate-y-1/2 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item.icon && (
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-safelight" : ""}`}
                    />
                  )}
                  <span className="text-caps">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
