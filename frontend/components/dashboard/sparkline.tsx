"use client";
import * as React from "react";

/**
 * Tiny line chart for stat-card sparklines. No axes, no grid — just a 14-point
 * trendline that shows up inside a stat card.
 */
export function Sparkline({
  values,
  stroke = "hsl(var(--gcpallet-primary))",
  width = 96,
  height = 28,
  fill = "transparent",
}: {
  values: number[];
  stroke?: string;
  width?: number;
  height?: number;
  fill?: string;
}) {
  const points = React.useMemo(() => {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y] as const;
    });
  }, [values, width, height]);

  if (points.length === 0) {
    return <div style={{ width, height }} aria-hidden />;
  }

  const path = points
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`))
    .join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(2)},${height} L${points[0][0].toFixed(2)},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="overflow-visible"
    >
      <path d={area} fill={fill} opacity={0.12} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={stroke}
      />
    </svg>
  );
}
