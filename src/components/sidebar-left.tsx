"use client";

import * as React from "react";
import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";

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
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-[var(--sidebar-accent)]"
            >
              <Link href="/" className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="lab-dots grid size-7 shrink-0 place-items-center rounded-[5px] border border-[var(--line-strong)] text-white/65"
                />
                <span className="font-display text-lg tracking-tight">
                  PixelSynth
                </span>
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
