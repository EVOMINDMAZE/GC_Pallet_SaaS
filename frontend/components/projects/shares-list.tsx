"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Eye, Calendar } from "lucide-react";
import type { ShareRecord } from "@/hooks/useShares";
import { formatCurrency, formatDate } from "@/lib/format";

function expiresLabel(iso: string | null): { text: string; tone: "ok" | "warn" | "danger" } {
  if (!iso) return { text: "No expiry", tone: "ok" };
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return { text: "Expired", tone: "danger" };
  if (ms < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
    return { text: `Expires in ${hours}h`, tone: "warn" };
  }
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return { text: `Expires in ${days}d`, tone: "ok" };
}

export function SharesList({
  shares,
  onRevoke,
}: {
  shares: ShareRecord[] | undefined;
  onRevoke: (token: string) => void | Promise<void>;
}) {
  if (!shares) {
    return <div className="text-xs text-muted-foreground">Loading…</div>;
  }
  if (shares.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
        No active links. Generate one to share this project.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {shares.map((s) => {
        const { text, tone } = expiresLabel(s.expires_at);
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 text-xs">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-foreground">
                  {s.view_count ?? 0}
                </span>
                <span className="text-muted-foreground">views</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span
                  className={
                    tone === "danger"
                      ? "text-destructive"
                      : tone === "warn"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }
                >
                  {text}
                </span>
                <span className="text-muted-foreground/60">·</span>
                <span>created {formatDate(s.created)}</span>
              </div>
            </div>
            <a
              href={`/share/${s.token}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRevoke(s.token)}
              aria-label="Revoke link"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
