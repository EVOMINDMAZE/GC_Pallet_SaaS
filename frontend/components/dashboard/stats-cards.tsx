"use client";
import { FolderKanban, FileText, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/format";

export function StatsCards() {
  const { data: projects } = useProjects();
  const { data: documents } = useDocuments();
  const { data: inventory } = useInventory();

  const totalBudget = projects?.reduce((sum, p) => sum + (p.budget ?? 0), 0) ?? 0;

  const cards = [
    {
      label: "Active Projects",
      value: projects?.filter((p) => p.status === "active").length ?? 0,
      icon: FolderKanban,
    },
    { label: "Documents", value: documents?.length ?? 0, icon: FileText },
    { label: "Inventory Items", value: inventory?.length ?? 0, icon: Package },
    { label: "Total Budget", value: formatCurrency(totalBudget), icon: DollarSign },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
