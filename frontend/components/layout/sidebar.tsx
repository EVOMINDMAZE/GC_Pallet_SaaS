"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/inventory", label: "Inventory", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r bg-muted/30 md:block md:w-60">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-lg font-semibold">
          GC Pallet
        </Link>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((it) => {
          const active =
            pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
