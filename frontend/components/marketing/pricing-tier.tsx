import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type PricingTierData = {
  id: "starter" | "crew" | "pro";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  features: string[];
};

export function PricingTier({
  tier,
  period,
}: {
  tier: PricingTierData;
  period: "monthly" | "yearly";
}) {
  const price = period === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
  const isFree = price === 0;
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border bg-gcpallet-card p-6 shadow-sm",
        tier.highlighted
          ? "border-gcpallet-primary shadow-lg ring-1 ring-gcpallet-primary lg:scale-[1.02]"
          : "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-h3 font-semibold text-gcpallet-card-foreground">{tier.name}</h3>
          <p className="text-body text-gcpallet-muted-foreground">{tier.tagline}</p>
        </div>
        {tier.highlighted && (
          <Badge variant="primary">Most popular</Badge>
        )}
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        {isFree ? (
          <span className="text-h1 font-bold text-gcpallet-card-foreground">Free</span>
        ) : (
          <>
            <span className="text-h1 font-bold text-gcpallet-card-foreground">${price}</span>
            <span className="text-body text-gcpallet-muted-foreground">
              / {period === "monthly" ? "mo" : "mo, billed yearly"}
            </span>
          </>
        )}
      </div>

      <Button
        asChild
        variant={tier.highlighted ? "primary" : "outline"}
        className="mt-6"
      >
        <a href={tier.ctaHref}>{tier.ctaLabel}</a>
      </Button>

      <ul className="mt-8 space-y-3 text-body text-gcpallet-card-foreground">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}