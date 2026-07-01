import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  /**
   * Optional change-indicator pill (right of the value).
   *
   * NOTE: currently unused by the four dashboard stat cards — the dashboard
   * only renders one period of data, so there is no prior period to compare
   * against and the pill would always read `+100%` (or `—`). The prop is kept
   * on the API so callers can use it once a real previous-period comparison
   * is wired in. See `.trae/specs/dashboard-stat-card-polish/spec.md`.
   */
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
        {/* Icon + label group can shrink so the aside slot keeps a fixed width. */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gcpallet-accent text-gcpallet-accent-foreground">
              {icon}
            </div>
          )}
          <span className="truncate whitespace-nowrap text-label uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        {/* The aside slot is locked to the sparkline's natural footprint so
            the SVG inside it can't grow and bleed past the card. */}
        {aside && <div className="flex-none">{aside}</div>}
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
