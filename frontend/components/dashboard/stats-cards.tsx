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
  const days = RANGE_DAYS[range];
  const since = useSince(range);
  const prevSince = usePrevSince(range);

  const projQ = useProjects({ createdAfter: since });
  const docsQ = useDocuments({ uploadedAfter: since });
  const invQ = useInventory({ updatedAfter: since });
  const prevProjQ = useProjects({ createdAfter: prevSince });
  const prevDocsQ = useDocuments({ uploadedAfter: prevSince });
  const prevInvQ = useInventory({ updatedAfter: since });
  const allProjQ = useProjects();

  const projects = projQ.data ?? [];
  const documents = docsQ.data ?? [];
  const inventory = invQ.data ?? [];
  const prevProjects = prevProjQ.data ?? [];
  const prevDocs = prevDocsQ.data ?? [];
  const prevInv = prevInvQ.data ?? [];
  const allProjects = allProjQ.data ?? [];

  const totalBudget = (allProjects ?? []).reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const activeProjects = (allProjects ?? []).filter((p) => p.status === "active").length;

  const projSpark = bucketByDay(projects, days).map((b) => b.count);
  const docSpark = bucketByDay(documents, days, "uploaded_at").map((b) => b.count);
  const invSpark = bucketByDay(invQ.data ?? [], days, "last_updated").map((b) => b.count);

  const projDelta = pctDelta(projects.length, prevProjects.length);
  const docDelta = pctDelta(documents.length, prevDocs.length);
  const invDelta = pctDelta(inventory.length, prevInv.length);

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
        caption={`${projects.length} new ${range === "all" ? "total" : "in period"}`}
        trend={{ label: projDelta.text, variant: projDelta.positive ? "success" : "warning" }}
        aside={<Sparkline values={projSpark} />}
      />
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label="Documents"
        value={documents.length}
        caption={`of ${prevDocs.length + documents.length} trend`}
        trend={{ label: docDelta.text, variant: docDelta.positive ? "success" : "info" }}
        aside={<Sparkline values={docSpark} stroke="hsl(var(--info))" />}
      />
      <StatCard
        icon={<Package className="h-5 w-5" />}
        label="Inventory Items"
        value={inventory.length}
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

function useSince(range: DashboardRange): string | undefined {
  if (range === "all") return undefined;
  const days = RANGE_DAYS[range];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function usePrevSince(range: DashboardRange): string | undefined {
  if (range === "all") return undefined;
  const days = RANGE_DAYS[range];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days * 2);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
