"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, CheckCircle2, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav, SidebarHeader } from "./sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/hooks/useAuth";

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "Workspace", title: "Operations overview" },
  "/projects": { eyebrow: "Workspace", title: "Project controls" },
  "/projects/new": { eyebrow: "Project controls", title: "New project" },
  "/documents": { eyebrow: "Workspace", title: "Documents" },
  "/inventory": { eyebrow: "Workspace", title: "Inventory" },
  "/settings": { eyebrow: "Account", title: "Settings" },
};

function useCrumbs(pathname: string | null) {
  if (!pathname || pathname === "/dashboard") return [];
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    label: decodeURIComponent(p),
  }));
}

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const crumbs = useCrumbs(pathname);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // Defer auth-dependent rendering until after mount so the server
  // (no auth context) and first client paint match exactly.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const heading =
    TITLES[pathname ?? "/"] ??
    (pathname?.startsWith("/projects/")
      ? { eyebrow: "Project controls", title: "Project detail" }
      : { eyebrow: "Workspace", title: "GC Pallet" });

  // Close drawer on route change.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            className="md:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <SheetContent side="left" className="flex flex-col gap-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarHeader />
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2.5 text-sm">
          <nav className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {heading.eyebrow}
            </span>
            {crumbs.map((c, i) => (
              <React.Fragment key={c.href}>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                <Link
                  href={c.href}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary focus-visible:ring-offset-2 rounded"
                >
                  {c.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="success" className="hidden sm:inline-flex gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Brand approved
        </Badge>
        <ThemeToggle className="hidden sm:inline-flex" />
        <span className="hidden md:inline text-xs font-medium text-foreground">
          {mounted ? (user?.name ?? user?.email ?? "Account") : "Account"}
        </span>
        <UserMenu />
      </div>
    </header>
  );
}