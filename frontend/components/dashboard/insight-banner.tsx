"use client";
import Link from "next/link";
import { Lightbulb, AlertCircle, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";

type Insight =
  | { kind: "info"; icon: "lightbulb"; title: string; body: string; href?: string; hrefLabel?: string }
  | { kind: "warning"; icon: "alert"; title: string; body: string; href?: string; hrefLabel?: string };

export function InsightBanner() {
  const { data: projects } = useProjects();
  const { data: documents } = useDocuments();
  const { data: inventory } = useInventory();

  const insight: Insight | null = pickInsight({
    projects: projects ?? [],
    documents: documents ?? [],
    inventory: inventory ?? [],
  });

  if (!insight) return null;
  const Icon = insight.icon === "alert" ? AlertCircle : Lightbulb;
  const tone =
    insight.kind === "warning"
      ? "border-warning/30 bg-warning-soft text-warning-foreground_soft"
      : "border-info/30 bg-info-soft text-info-foreground_soft";
  const iconTone = insight.kind === "warning" ? "text-warning" : "text-info";

  return (
    <div className={`flex flex-col gap-2 rounded-lg border ${tone} px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-start gap-3 sm:items-center">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} aria-hidden />
        <div>
          <div className="text-sm font-semibold text-foreground">{insight.title}</div>
          <div className="text-xs text-foreground/70">{insight.body}</div>
        </div>
      </div>
      {insight.href && insight.hrefLabel && (
        <Link
          href={insight.href}
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-foreground hover:underline sm:self-auto"
        >
          {insight.hrefLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function pickInsight({
  projects,
  documents,
  inventory,
}: {
  projects: { id: string; status: string }[];
  documents: { id: string }[];
  inventory: { id: string; quantity: number; location: string }[];
}): Insight | null {
  if (projects.length === 0) {
    return {
      kind: "info",
      icon: "lightbulb",
      title: "Create your first project",
      body: "Projects are the unit of work in GC Pallet — track budget, documents, and inventory per site.",
      href: "/projects/new",
      hrefLabel: "Start a project",
    };
  }
  const lowStock = inventory.filter((i) => i.quantity < 50 && i.location !== "in_transit");
  if (lowStock.length > 0) {
    return {
      kind: "warning",
      icon: "alert",
      title: `${lowStock.length} item${lowStock.length === 1 ? "" : "s"} below 50 units`,
      body: "Consider reordering to avoid site downtime.",
      href: "/inventory",
      hrefLabel: "Review inventory",
    };
  }
  const activeOnes = projects.filter((p) => p.status === "active");
  if (activeOnes.length > 0 && documents.length === 0) {
    return {
      kind: "info",
      icon: "lightbulb",
      title: "Upload your first document",
      body: "Permits, contracts, and invoices live alongside each project.",
      href: "/documents",
      hrefLabel: "Open documents",
    };
  }
  return null;
}
