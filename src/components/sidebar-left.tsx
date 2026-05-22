"use client";

import * as React from "react";
import Link from "next/link";
import { AudioLines, BrainCircuit, Sparkles } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
// import { NavUser } from "./nav-user";

const data = {
  navMain: [
    {
      title: "Editor",
      url: "/editor",
      icon: Sparkles,
    },
    {
      title: "Algorithms",
      url: "/algorithms",
      icon: BrainCircuit,
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <AudioLines className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">PixelSynth v.0</span>
                  <span className="text-muted-foreground text-xs"></span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Studio">
          <NavMain items={data.navMain} />
        </nav>
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser
          user={{
            name: "PixelSynth",
            email: "pixelsynth@example.com",
            avatar: "",
          }}
        /> */}
      </SidebarFooter>
    </Sidebar>
  );
}
