"use client";
import { cn } from "@/lib/utils";
import type { DashboardRange } from "@/hooks/useDashboardData";

const OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: DashboardRange;
  onChange: (next: DashboardRange) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Time range"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-gcpallet-muted/60 p-1"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all focus-ring",
              selected
                ? "bg-gcpallet-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
