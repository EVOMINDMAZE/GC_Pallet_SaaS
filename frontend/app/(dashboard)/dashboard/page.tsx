"use client";
import * as React from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectStatusDonut } from "@/components/dashboard/project-status-donut";
import { DocumentsTimeline } from "@/components/dashboard/documents-timeline";
import { InventoryByLocation } from "@/components/dashboard/inventory-by-location";
import { ProjectTimelineList } from "@/components/dashboard/project-timeline-list";
import { TimeRangeSelector } from "@/components/dashboard/time-range-selector";
import { Greeting } from "@/components/dashboard/greeting";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import type { DashboardRange } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const [range, setRange] = React.useState<DashboardRange>("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Workspace · Overview</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Dashboard</h1>
          <Greeting />
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      <InsightBanner />

      <StatsCards range={range} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectStatusDonut />
        <DocumentsTimeline days={range === "all" ? 30 : range === "7d" ? 7 : 14} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InventoryByLocation />
        <ProjectTimelineList />
      </div>

      <RecentActivity />
    </div>
  );
}
