import Link from "next/link";
import { ClipboardList, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gcpallet-muted/30">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-ring"
            aria-label="GC Pallet home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gcpallet-primary text-white">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                GC Pallet
              </span>
              <span className="text-body-strong tracking-tight">Operations Hub</span>
            </span>
          </Link>
          <span className="ml-1 hidden items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline-flex">
            <Globe className="h-3 w-3" /> Public view
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-background py-4 text-center text-xs text-muted-foreground">
        Shared via <Link href="/" className="text-gcpallet-primary hover:underline">GC Pallet</Link> · Read-only snapshot
      </footer>
    </div>
  );
}
