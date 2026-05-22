"use client";

import Link from "next/link";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
import { siteConfig } from "@/lib/site";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";

export function GlobalHeader() {
  const { extra } = useBreadcrumb();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger className="hover:text-foreground text-[var(--paper-dim)]" />
        <Separator
          orientation="vertical"
          className="mr-1 bg-[var(--line-strong)] data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList className="font-mono text-[11px] tracking-[0.16em] uppercase">
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="hover:text-foreground text-[var(--paper-dim)] transition-colors"
              >
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {extra && (
              <>
                <BreadcrumbSeparator className="text-[var(--line-strong)] [&>svg]:size-3" />
                <span className="[&_a]:text-foreground [&_a]:transition-colors [&_a]:hover:text-[var(--safelight)]">
                  {extra}
                </span>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3 px-4">
        <span
          aria-hidden="true"
          className="hidden items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-[var(--paper-dim)] uppercase md:inline-flex"
        >
          <span className="lab-blink size-1.5 rounded-full bg-[var(--safelight)]" />
          Darkroom
        </span>
      </div>
    </header>
  );
}
