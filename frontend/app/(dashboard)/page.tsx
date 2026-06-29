"use client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <StatsCards />
      <ProjectStatusChart />
      <RecentActivity />
    </div>
  );
}
