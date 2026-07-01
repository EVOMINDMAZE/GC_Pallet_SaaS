"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useDocuments } from "@/hooks/useDocuments";
import { bucketByDay } from "@/components/dashboard/dashboard-helpers";
import { FileText } from "lucide-react";

export function DocumentsTimeline({ days = 14 }: { days?: number }) {
  const { data: documents, isLoading } = useDocuments();
  const items = documents ?? [];
  const series = bucketByDay(items, days, "uploadedAt");

  return (
    <Card>
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
              <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--chart-grid))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--chart-axis))" }}
                  interval={days > 14 ? "preserveStartEnd" : 0}
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
                />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
