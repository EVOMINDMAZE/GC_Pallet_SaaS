"use client";
import * as React from "react";
import {
  CalendarDays,
  MapPin,
  Wallet,
  AlertTriangle,
  Link2,
  ChevronLeft,
  Eye,
  Hash,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

interface ShareResponse {
  project: {
    id: string;
    name: string;
    status: string;
    address: string;
    budget: number;
    start_date: string;
    end_date: string;
    created: string;
  };
  inventory: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
    location: string;
    cost_per_unit: number;
    last_updated: string;
  }>;
  owner: { id: string; name: string };
  share: {
    id: string;
    expiresAt: string | null;
    viewCount: number;
    createdAt: string;
  };
}

function ExpiryFooter({ expiresAt, ownerName, viewCount }: {
  expiresAt: string | null;
  ownerName: string;
  viewCount: number;
}) {
  let text = "No expiry";
  if (expiresAt) {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms < 0) text = "Expired";
    else if (ms < 24 * 60 * 60 * 1000) {
      const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
      text = `Expires in ${hours}h`;
    } else {
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      text = `Expires in ${days}d`;
    }
  }
  return (
    <p className="text-center text-xs text-muted-foreground">
      Shared by <span className="font-medium text-foreground">{ownerName || "a team member"}</span>
      {" · "}
      {text}
      {" · "}
      {viewCount} {viewCount === 1 ? "view" : "views"}
    </p>
  );
}

function terminalState(opts: {
  title: string;
  detail: string;
  variant?: "expired" | "revoked" | "unknown";
}) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {opts.variant === "expired" ? <Clock className="h-6 w-6" /> :
            opts.variant === "revoked" ? <AlertTriangle className="h-6 w-6" /> :
            <Link2 className="h-6 w-6" />}
        </div>
        <h1 className="text-h2 font-bold tracking-tight">{opts.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{opts.detail}</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-sm text-gcpallet-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back to home
        </a>
      </div>
    </div>
  );
}

export function SharedProjectView({ token }: { token: string }) {
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "ok"; data: ShareResponse }
    | { kind: "expired" }
    | { kind: "revoked" }
    | { kind: "unknown" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/shares/${token}`)
      .then(async (res) => {
        if (!alive) return;
        if (res.status === 410) return setState({ kind: "expired" });
        if (res.status === 404) return setState({ kind: "unknown" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          return setState({ kind: "error", message: j.error || `HTTP ${res.status}` });
        }
        const j = (await res.json()) as ShareResponse;
        if (j.share.expiresAt && new Date(j.share.expiresAt) < new Date()) {
          setState({ kind: "expired" });
        } else {
          setState({ kind: "ok", data: j });
        }
      })
      .catch((e) => alive && setState({ kind: "error", message: e.message }));
    return () => {
      alive = false;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-10 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (state.kind === "unknown") {
    return terminalState({
      title: "Link not found",
      detail: "This share link doesn't exist or has been removed.",
      variant: "unknown",
    });
  }

  if (state.kind === "revoked") {
    return terminalState({
      title: "Link revoked",
      detail: "The owner of this project revoked this link. Ask them to send a new one.",
      variant: "revoked",
    });
  }

  if (state.kind === "expired") {
    return terminalState({
      title: "Link expired",
      detail: "This share link has expired. Ask the project owner to send a fresh one.",
      variant: "expired",
    });
  }

  if (state.kind === "error") {
    return terminalState({
      title: "Couldn't load this project",
      detail: state.message,
    });
  }

  const { project, inventory, owner, share } = state.data;
  const totalInventory = inventory.reduce(
    (sum, i) => sum + (i.quantity ?? 0) * (i.cost_per_unit ?? 0),
    0,
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <span className="text-label uppercase tracking-wider text-muted-foreground">
          Public snapshot · {share.viewCount} {share.viewCount === 1 ? "view" : "views"}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight text-foreground">{project.name}</h1>
          <StatusBadge status={project.status as "planning" | "active" | "completed" | "on_hold"} />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {project.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {project.address}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> Budget {formatCurrency(project.budget)}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(project.start_date)} → {formatDate(project.end_date)}
          </span>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Inventory on this project
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {inventory.length} {inventory.length === 1 ? "item" : "items"} ·{" "}
            {formatCurrency(totalInventory)}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {inventory.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No inventory recorded for this project.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.item_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {i.quantity} {i.unit}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {i.location.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency((i.quantity ?? 0) * (i.cost_per_unit ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          <Eye className="h-3 w-3" />
          This is a read-only snapshot. Documents and full activity logs are
          not shared via this link.
        </p>
        <p className="mt-2">
          <ExpiryFooter
            expiresAt={share.expiresAt}
            ownerName={owner.name}
            viewCount={share.viewCount}
          />
        </p>
      </div>
    </div>
  );
}
