import * as React from "react";

export function FAQ({
  items,
}: {
  items: { q: string; a: React.ReactNode }[];
}) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-gcpallet-card">
      {items.map((item) => (
        <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-body-strong text-gcpallet-card-foreground">
            <span>{item.q}</span>
            <span
              aria-hidden
              className="text-gcpallet-muted-foreground transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-3 text-body text-gcpallet-muted-foreground">{item.a}</div>
        </details>
      ))}
    </div>
  );
}