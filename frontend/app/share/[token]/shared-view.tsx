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
  FileText,
  Download,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";

// The shape returned by /api/shares/[token]. Must match
// `PublicShareView` in lib/types.ts.
interface ShareResponse {
  ok: true;
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
  };
  owner: { name: string };
  documents: Array<{
    id: string;
    name: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl: string;
  }>;
  share: { label: string | null; expiresAt: string | null };
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function ExpiryFooter({
  expiresAt,
  ownerName,
}: {
  expiresAt: string | null;
  ownerName: string;
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
      Shared by{" "}
      <span className="font-medium text-foreground">
        {ownerName || "a team member"}
      </span>
      {" · "}
      {text}
    </p>
  );
}

function terminalState(opts: {
  title: string;
  detail: string;
  variant?: "expired" | "revoked" | "unknown" | "error";
}) {
  const Icon =
    opts.variant === "expired"
      ? Clock
      : opts.variant === "revoked"
        ? AlertTriangle
        : opts.variant === "error"
          ? AlertTriangle
          : Link2;
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
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
        if (res.status === 410) {
          const body = (await res.json().catch(() => ({}))) as {
            reason?: string;
          };
          setState(body.reason === "revoked" ? { kind: "revoked" } : { kind: "expired" });
          return;
        }
        if (res.status === 404) return setState({ kind: "unknown" });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          return setState({
            kind: "error",
            message: j.error || `HTTP ${res.status}`,
          });
        }
        const j = (await res.json()) as ShareResponse;
        if (
          j.share.expiresAt &&
          new Date(j.share.expiresAt).getTime() < Date.now()
        ) {
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
      detail:
        "The owner of this project revoked this link. Ask them to send a new one.",
      variant: "revoked",
    });
  }
  if (state.kind === "expired") {
    return terminalState({
      title: "Link expired",
      detail:
        "This share link has expired. Ask the project owner to send a fresh one.",
      variant: "expired",
    });
  }
  if (state.kind === "error") {
    return terminalState({
      title: "Couldn't load this project",
      detail: state.message,
      variant: "error",
    });
  }

  const { project, documents, owner, share } = state.data;

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <span className="text-label text-muted-foreground uppercase tracking-wider">
          Public snapshot
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 font-bold tracking-tight text-foreground">
            {project.name}
          </h1>
          <StatusBadge
            status={
              project.status as "planning" | "active" | "completed" | "on_hold"
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {project.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {project.address}
            </span>
          )}
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Documents
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No documents attached to this project.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.mimeType}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(d.sizeBytes)}
                    </TableCell>
                    <TableCell>
                      {d.downloadUrl && (
                        <a
                          href={d.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gcpallet-primary hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> Open
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          This is a read-only snapshot. Edit, inventory, and activity
          logs are not shared via this link.
        </p>
        <p className="flex items-center justify-center gap-1.5">
          <Eye className="h-3 w-3" />
          <ExpiryFooter expiresAt={share.expiresAt} ownerName={owner.name} />
        </p>
      </div>
    </div>
  );
}
