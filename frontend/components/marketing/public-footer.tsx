import Link from "next/link";
import { ClipboardList } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/register", label: "Start free" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-gcpallet-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gcpallet-primary text-gcpallet-primary-foreground shadow-sm">
              <ClipboardList className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-body-strong text-gcpallet-card-foreground">
              GC Pallet
            </span>
          </Link>
          <p className="text-body text-gcpallet-muted-foreground">
            Operations Hub for general contractors. Built for the people who actually build things.
          </p>
        </div>

        {columns.map((c) => (
          <div key={c.title} className="space-y-3">
            <p className="text-label uppercase tracking-wider text-gcpallet-muted-foreground">
              {c.title}
            </p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-body text-gcpallet-card-foreground transition hover:text-gcpallet-primary focus-ring rounded"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-body text-gcpallet-muted-foreground md:px-6">
          <span>© {new Date().getFullYear()} GC Pallet. All rights reserved.</span>
          <span className="text-label uppercase tracking-wider">Made for the field.</span>
        </div>
      </div>
    </footer>
  );
}