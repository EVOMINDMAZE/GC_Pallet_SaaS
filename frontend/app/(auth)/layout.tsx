import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gcpallet-muted/40">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-14 items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 focus-ring rounded-md">
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
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
