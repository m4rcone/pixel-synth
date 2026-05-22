"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
                className="data-[active=true]:bg-[var(--sidebar-accent)]"
              >
                <Link
                  href={item.url}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-[var(--paper-dim)] hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -left-2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--safelight)] transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {item.icon && (
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-[var(--safelight)]" : ""}`}
                    />
                  )}
                  <span className="font-mono text-[11px] tracking-[0.16em] uppercase">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
