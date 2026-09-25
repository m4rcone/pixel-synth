"use client";

import * as React from "react";
import Link from "next/link";
import { Aperture, LayoutGrid } from "lucide-react";
import { Logo } from "@/components/logo";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Editor",
      url: "/editor",
      icon: Aperture,
    },
    {
      title: "Algorithms",
      url: "/algorithms",
      icon: LayoutGrid,
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <nav aria-label="Studio">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-sidebar-accent"
              >
                <Link href="/" aria-label="PixelSynth home">
                  <Logo className="[&_svg]:size-7" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>
      </Sidebar>
    </nav>
  );
}
