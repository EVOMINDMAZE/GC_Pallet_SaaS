import * as React from "react";

/**
 * Pure-SVG product mockup. No raster images; respects light/dark via CSS vars.
 * Looks like a dashboard frame with two stat cards and a small project list.
 */
export function ProductMockup() {
  return (
    <svg
      viewBox="0 0 480 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GC Pallet dashboard preview"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--gcpallet-accent))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" rx="12" fill="url(#bg)" />

      {/* Window chrome */}
      <rect x="16" y="16" width="448" height="328" rx="10" fill="hsl(var(--gcpallet-card))" stroke="hsl(var(--border))" />
      <rect x="16" y="16" width="448" height="36" rx="10" fill="hsl(var(--gcpallet-muted))" />
      <circle cx="34" cy="34" r="4" fill="hsl(var(--destructive) / 0.6)" />
      <circle cx="48" cy="34" r="4" fill="hsl(var(--warning) / 0.6)" />
      <circle cx="62" cy="34" r="4" fill="hsl(var(--success) / 0.6)" />

      {/* Sidebar */}
      <rect x="16" y="52" width="120" height="292" fill="hsl(var(--gcpallet-card))" />
      <rect x="32" y="68" width="32" height="32" rx="8" fill="hsl(var(--gcpallet-primary))" />
      <rect x="72" y="72" width="56" height="6" rx="3" fill="hsl(var(--gcpallet-card-foreground))" />
      <rect x="72" y="84" width="40" height="4" rx="2" fill="hsl(var(--gcpallet-muted-foreground))" />
      <rect x="28" y="116" width="96" height="10" rx="4" fill="hsl(var(--gcpallet-primary))" />
      <rect x="28" y="138" width="96" height="10" rx="4" fill="hsl(var(--gcpallet-muted))" />
      <rect x="28" y="160" width="96" height="10" rx="4" fill="hsl(var(--gcpallet-muted))" />
      <rect x="28" y="182" width="96" height="10" rx="4" fill="hsl(var(--gcpallet-muted))" />

      {/* Header */}
      <rect x="148" y="68" width="100" height="10" rx="4" fill="hsl(var(--gcpallet-card-foreground))" />
      <rect x="148" y="84" width="180" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
      <rect x="380" y="68" width="68" height="24" rx="6" fill="hsl(var(--gcpallet-primary))" />

      {/* Stat cards */}
      <g>
        <rect x="148" y="108" width="100" height="74" rx="8" fill="hsl(var(--gcpallet-card))" stroke="hsl(var(--border))" />
        <rect x="160" y="120" width="40" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
        <rect x="160" y="136" width="56" height="14" rx="4" fill="hsl(var(--gcpallet-card-foreground))" />
        <rect x="160" y="160" width="32" height="6" rx="3" fill="hsl(var(--success))" />
      </g>
      <g>
        <rect x="256" y="108" width="100" height="74" rx="8" fill="hsl(var(--gcpallet-card))" stroke="hsl(var(--border))" />
        <rect x="268" y="120" width="50" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
        <rect x="268" y="136" width="48" height="14" rx="4" fill="hsl(var(--gcpallet-card-foreground))" />
        <rect x="268" y="160" width="40" height="6" rx="3" fill="hsl(var(--info))" />
      </g>
      <g>
        <rect x="364" y="108" width="84" height="74" rx="8" fill="hsl(var(--gcpallet-card))" stroke="hsl(var(--border))" />
        <rect x="376" y="120" width="36" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
        <rect x="376" y="136" width="44" height="14" rx="4" fill="hsl(var(--gcpallet-card-foreground))" />
        <rect x="376" y="160" width="28" height="6" rx="3" fill="hsl(var(--gcpallet-warning))" />
      </g>

      {/* Table */}
      <rect x="148" y="200" width="300" height="120" rx="8" fill="hsl(var(--gcpallet-card))" stroke="hsl(var(--border))" />
      <rect x="160" y="212" width="80" height="6" rx="3" fill="hsl(var(--gcpallet-card-foreground))" />
      <rect x="160" y="232" width="276" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
      <rect x="160" y="248" width="276" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
      <rect x="160" y="264" width="276" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />
      <rect x="160" y="280" width="276" height="6" rx="3" fill="hsl(var(--gcpallet-muted-foreground))" />

      <rect x="380" y="304" width="68" height="6" rx="3" fill="hsl(var(--gcpallet-primary))" />
    </svg>
  );
}