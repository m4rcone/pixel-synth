import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";

type GlobalHeaderProps = {
  /** Current studio page, rendered as the last breadcrumb item. */
  page: string;
  /** Optional intermediate level, e.g. the catalog for a detail page. */
  parent?: { label: string; href: string };
};

export function GlobalHeader({ page, parent }: GlobalHeaderProps) {
  return (
    <header className="border-line bg-ink/85 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger className="text-paper-dim hover:text-paper" />
        <Separator
          orientation="vertical"
          className="bg-line-strong mr-1 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList className="text-caps">
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-paper-dim hover:text-paper transition-colors"
              >
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-paper-dim/60 [&>svg]:size-3.5" />
            {parent && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="text-paper-dim hover:text-paper transition-colors"
                  >
                    <Link href={parent.href}>{parent.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-paper-dim/60 [&>svg]:size-3.5" />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="text-paper truncate">
                {page}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
