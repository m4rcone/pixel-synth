"use client";

import * as React from "react";
import Link from "next/link";
import { Aperture, LayoutGrid, Palette } from "lucide-react";
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
    {
      title: "Palettes",
      url: "/palettes",
      icon: Palette,
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  // The landmark sits inside the sidebar, so it moves into the sheet on
  // smaller screens instead of staying behind, empty.
  return (
    <Sidebar collapsible="icon" {...props}>
      <nav aria-label="Studio" className="flex min-h-0 flex-1 flex-col">
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
      </nav>
    </Sidebar>
  );
}
