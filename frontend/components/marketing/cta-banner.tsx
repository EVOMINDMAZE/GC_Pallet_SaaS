import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBanner({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-gcpallet-accent via-gcpallet-card to-gcpallet-card p-8 shadow-sm md:p-12",
        className
      )}
    >
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow && (
          <p className="text-label uppercase tracking-wider text-gcpallet-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-h1 mt-3 font-bold tracking-tight text-gcpallet-card-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-body text-gcpallet-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel && (
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}