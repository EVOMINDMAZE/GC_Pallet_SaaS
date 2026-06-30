import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  trend?: { label: string; variant?: "success" | "warning" | "info" | "destructive" };
  /** Optional content rendered on the right side (e.g. <Sparkline values={...} />). */
  aside?: React.ReactNode;
}

export function StatCard({ icon, label, value, caption, trend, aside, className, ...props }: StatCardProps) {
  const trendVariant = {
    success: "bg-success-soft text-success-foreground_soft",
    warning: "bg-warning-soft text-warning-foreground_soft",
    info: "bg-info-soft text-info-foreground_soft",
    destructive: "bg-destructive-soft text-destructive-foreground_soft",
  }[trend?.variant ?? "success"];

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-gcpallet-card p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gcpallet-accent text-gcpallet-accent-foreground">
              {icon}
            </div>
          )}
          <span className="text-label uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        {aside}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-display font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              trendVariant
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
      {caption && <p className="mt-1.5 text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}
