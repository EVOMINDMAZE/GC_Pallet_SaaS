"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        scrolled
          ? "border-border bg-background/85 backdrop-blur"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-md">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gcpallet-primary text-gcpallet-primary-foreground shadow-sm">
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-label uppercase tracking-wider text-gcpallet-muted-foreground">
              GC Pallet
            </span>
            <span className="text-body-strong text-foreground">Operations Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-body-strong transition focus-ring rounded-md px-1",
                pathname?.startsWith(l.href)
                  ? "text-gcpallet-primary"
                  : "text-gcpallet-muted-foreground hover:text-gcpallet-card-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:inline-flex" />
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/register">Start free</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-body-strong transition focus-ring",
                  pathname?.startsWith(l.href)
                    ? "bg-gcpallet-accent text-gcpallet-accent-foreground"
                    : "text-gcpallet-card-foreground hover:bg-gcpallet-muted"
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-body-strong text-gcpallet-muted-foreground hover:bg-gcpallet-muted focus-ring"
            >
              Sign in
            </Link>
            <div className="px-3 pt-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}