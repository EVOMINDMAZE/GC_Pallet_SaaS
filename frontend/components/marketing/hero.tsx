import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  illustration,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  illustration?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gcpallet-accent/60 via-background to-background">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-72 bg-[radial-gradient(50%_60%_at_50%_0%,hsl(var(--gcpallet-primary)/0.18),transparent)]"
        aria-hidden
      />
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 md:px-6 md:py-28",
          illustration ? "lg:grid-cols-2 lg:items-center" : ""
        )}
      >
        <div className={cn("space-y-6", align === "center" && "mx-auto max-w-2xl text-center")}>
          {eyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-gcpallet-card px-3 py-1 text-label uppercase tracking-wider text-gcpallet-muted-foreground shadow-sm">
              {eyebrow}
            </p>
          )}
          <h1 className="text-display md:text-display font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-h3 font-normal text-gcpallet-muted-foreground">
              {subtitle}
            </p>
          )}
          <div className={cn("flex flex-wrap items-center gap-3", align === "center" && "justify-center")}>
            {primaryHref && primaryLabel && (
              <Button asChild variant="primary" size="lg">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {secondaryHref && secondaryLabel && (
              <Button asChild variant="outline" size="lg">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            )}
          </div>
        </div>
        {illustration && (
          <div className="relative">
            <div className="rounded-lg border border-border bg-gcpallet-card p-2 shadow-lg">
              {illustration}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}