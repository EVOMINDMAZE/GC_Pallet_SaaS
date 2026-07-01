"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useDocuments } from "@/hooks/useDocuments";
import { bucketByDay } from "@/components/dashboard/dashboard-helpers";
import { FileText } from "lucide-react";
import type { DashboardRange } from "@/hooks/useDashboardData";

const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 14, all: 30 };

function formatTick(value: string) {
  // `value` is a YYYY-MM-DD string from bucketByDay; show "Mon DD".
  const d = new Date(`${value}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function DocumentsTimeline({ range = "30d" }: { range?: DashboardRange }) {
  const router = useRouter();
  const { data: documents, isLoading } = useDocuments();
  const items = documents ?? [];
  const days = RANGE_DAYS[range];
  const series = bucketByDay(items, days, "uploadedAt");
  const href = `/documents?range=${range}`;

  // Pick an X-axis interval that keeps labels readable at the chart's
  // actual width. Recharts treats `interval` as "draw every Nth tick";
  // at 7d every label fits at 400 px, at 14d every other day is enough,
  // and at 30d+ we let the renderer cull what doesn't fit via
  // `minTickGap`.
  const xInterval: number | "preserveStartEnd" =
    days <= 7 ? 0 : days <= 14 ? 1 : "preserveStartEnd";

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary/40"
      aria-label={`Open documents for the last ${days} days`}
    >
      <Card className="cursor-pointer transition group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gcpallet-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Uploads per day</CardTitle>
          <CardDescription>{days}-day rolling view of documents added.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[220px]" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={series}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  onClick={() => router.push(href)}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid stroke="hsl(var(--chart-grid))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    interval={xInterval}
                    minTickGap={8}
                    tick={{ fontSize: 10, fill: "hsl(var(--chart-axis))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--chart-axis))" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--chart-grid))", opacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelFormatter={(label) => (typeof label === "string" ? formatTick(label) : String(label ?? ""))}
                    formatter={(v) => {
                      const n = typeof v === "number" ? v : Number(v);
                      return [`${n} upload${n === 1 ? "" : "s"}`, "Documents"];
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
