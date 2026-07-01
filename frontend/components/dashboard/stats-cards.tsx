"use client";
import { FolderKanban, FileText, Package, DollarSign, Sparkles } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { StatCard } from "@/components/ui/stat-card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/dashboard/sparkline";
import { bucketByDay, pctDelta } from "@/components/dashboard/dashboard-helpers";
import { formatCurrency } from "@/lib/format";
import type { DashboardRange } from "@/hooks/useDashboardData";

const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, all: 30 };

export function StatsCards({ range }: { range: DashboardRange }) {
  // The hooks always return the user's full data; we slice on the
  // client using the `range` prop. (Doing a server-side date filter
  // would require either a Postgres view or RPC, neither of which
  // we need for the free-tier volume we're at.)
  const projQ = useProjects();
  const docsQ = useDocuments();
  const invQ = useInventory();
  const allProjQ = useProjects();

  const projects = projQ.data ?? [];
  const documents = docsQ.data ?? [];
  const inventory = invQ.data ?? [];
  const allProjects = allProjQ.data ?? [];

  const days = RANGE_DAYS[range];
  const sinceMs = range === "all" ? 0 : Date.now() - days * 24 * 60 * 60 * 1000;
  const inRange = (iso?: string | null) =>
    !iso ? false : new Date(iso).getTime() >= sinceMs;

  const filteredProjects = projects.filter((p) => inRange(p.createdAt));
  const filteredDocuments = documents.filter((d) => inRange(d.uploadedAt));
  const filteredInventory = inventory.filter((i) => inRange(i.lastUpdated));

  const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const activeProjects = allProjects.filter((p) => p.status === "active").length;

  const projSpark = bucketByDay(filteredProjects, days, "createdAt").map((b) => b.count);
  const docSpark = bucketByDay(filteredDocuments, days, "uploadedAt").map((b) => b.count);
  const invSpark = bucketByDay(filteredInventory, days, "lastUpdated").map((b) => b.count);

  const projDelta = pctDelta(filteredProjects.length, 0);
  const docDelta = pctDelta(filteredDocuments.length, 0);
  const invDelta = pctDelta(filteredInventory.length, 0);

  const isLoading = projQ.isLoading || docsQ.isLoading || invQ.isLoading || allProjQ.isLoading;
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<FolderKanban className="h-5 w-5" />}
        label="Active Projects"
        value={activeProjects}
        caption={`${filteredProjects.length} new ${range === "all" ? "total" : "in period"}`}
        trend={{ label: projDelta.text, variant: projDelta.positive ? "success" : "warning" }}
        aside={<Sparkline values={projSpark} />}
      />
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label="Documents"
        value={filteredDocuments.length}
        caption={`of ${documents.length} total`}
        trend={{ label: docDelta.text, variant: docDelta.positive ? "success" : "info" }}
        aside={<Sparkline values={docSpark} stroke="hsl(var(--info))" />}
      />
      <StatCard
        icon={<Package className="h-5 w-5" />}
        label="Inventory Items"
        value={filteredInventory.length}
        caption="Across active job sites"
        trend={{ label: invDelta.text, variant: invDelta.positive ? "success" : "warning" }}
        aside={<Sparkline values={invSpark} stroke="hsl(var(--success))" />}
      />
      <StatCard
        icon={<DollarSign className="h-5 w-5" />}
        label="Total Budget"
        value={formatCurrency(totalBudget)}
        caption={`Across ${allProjects.length} project${allProjects.length === 1 ? "" : "s"}`}
        aside={<Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />}
      />
    </div>
  );
}
