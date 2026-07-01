"use client";
import * as React from "react";

/**
 * Tiny line chart for stat-card sparklines. No axes, no grid — just a 14-point
 * trendline that shows up inside a stat card.
 *
 * The wrapper div + SVG `clipPath` are the seatbelts that keep the line, area,
 * and end-dot inside the card. Before this fix the SVG used `overflow-visible`,
 * which let the end-dot and (at narrow card widths) the line itself paint past
 * the card's right or top edge.
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

  // Reserve a fixed footprint so the SVG cannot grow inside a flex parent.
  // The `flex-none` on the wrapper + the `clipPath` on the SVG together
  // guarantee the line never bleeds past this box.
  if (points.length === 0) {
    return <div className="h-7 w-24 flex-none" style={{ width, height }} aria-hidden />;
  }

  const path = points
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`))
    .join(" ");
  const area = `${path} L${points[points.length - 1][0].toFixed(2)},${height} L${points[points.length - 1][0].toFixed(2)},${height} Z`;

  return (
    <div className="h-7 w-24 flex-none" style={{ width, height }} aria-hidden>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        <defs>
          <clipPath id="spark-clip">
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>
        <g clipPath="url(#spark-clip)">
          <path d={area} fill={fill} opacity={0.12} />
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r={2}
            fill={stroke}
          />
        </g>
      </svg>
    </div>
  );
}
