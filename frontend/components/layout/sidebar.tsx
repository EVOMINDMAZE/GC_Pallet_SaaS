"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FolderKanban,
  Settings,
  Truck,
  Files,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string }> };

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/documents", label: "Documents", Icon: Files },
  { href: "/inventory", label: "Inventory", Icon: Truck },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map(({ href, label, Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-body-strong transition focus-ring",
              isActive
                ? "bg-gcpallet-primary text-gcpallet-primary-foreground shadow-sm"
                : "text-gcpallet-secondary-foreground hover:bg-gcpallet-muted"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-gcpallet-primary-foreground" : "text-gcpallet-muted-foreground group-hover:text-gcpallet-secondary-foreground"
              )}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarHeader() {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gcpallet-primary text-gcpallet-primary-foreground shadow-sm">
        <ClipboardList className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-label uppercase tracking-wider text-gcpallet-muted-foreground">
          GC Pallet
        </span>
        <span className="text-body-strong text-gcpallet-card-foreground">
          Operations Hub
        </span>
      </span>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-gcpallet-card">
      <SidebarHeader />
      <SidebarNav />
    </aside>
  );
}