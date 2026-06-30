"use client";

import { cn } from "@/lib/utils";

export function PricingToggle({
  value,
  onChange,
}: {
  value: "monthly" | "yearly";
  onChange: (next: "monthly" | "yearly") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-gcpallet-card p-1 shadow-sm"
    >
      {(["monthly", "yearly"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-full px-4 py-1.5 text-body-strong transition focus-ring",
            value === opt
              ? "bg-gcpallet-primary text-gcpallet-primary-foreground shadow-sm"
              : "text-gcpallet-muted-foreground hover:text-gcpallet-card-foreground"
          )}
        >
          {opt === "monthly" ? "Monthly" : "Yearly — save 20%"}
        </button>
      ))}
    </div>
  );
}