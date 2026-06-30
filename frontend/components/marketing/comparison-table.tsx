import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ComparisonTable({
  columns,
  rows,
}: {
  columns: { name: string; highlight?: boolean }[];
  rows: { feature: string; cells: (boolean | string)[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-gcpallet-card shadow-sm">
      <table className="w-full text-left text-body">
        <thead>
          <tr className="border-b border-border bg-gcpallet-muted/40 text-label uppercase tracking-wider text-gcpallet-muted-foreground">
            <th className="px-4 py-3 font-semibold">Feature</th>
            {columns.map((c) => (
              <th
                key={c.name}
                className={cn(
                  "px-4 py-3 font-semibold",
                  c.highlight && "text-gcpallet-primary"
                )}
              >
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 font-medium text-gcpallet-card-foreground">{r.feature}</td>
              {r.cells.map((cell, idx) => (
                <td key={idx} className="px-4 py-3 text-gcpallet-muted-foreground">
                  {typeof cell === "boolean" ? (
                    cell ? (
                      <Check className="h-4 w-4 text-success" aria-label="Included" />
                    ) : (
                      <span className="text-gcpallet-muted-foreground/40">—</span>
                    )
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}