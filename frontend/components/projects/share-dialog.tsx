"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, Loader2 } from "lucide-react";
import { createShare, useProjectShares, revokeShare } from "@/hooks/useShares";
import { SharesList } from "@/components/projects/shares-list";

type Expiry = "1d" | "7d" | "30d" | "never";

const EXPIRY_OPTIONS: { id: Expiry; label: string; description: string }[] = [
  { id: "1d", label: "24 hours", description: "Burn after a site visit" },
  { id: "7d", label: "7 days", description: "Good for a weekly review" },
  { id: "30d", label: "30 days", description: "For active phases" },
  { id: "never", label: "No expiry", description: "Until you revoke it" },
];

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectName: string;
}) {
  const [expiry, setExpiry] = React.useState<Expiry>("7d");
  const [creating, setCreating] = React.useState(false);
  const [latestUrl, setLatestUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { data: shares, mutate } = useProjectShares(open ? projectId : null);

  // Reset state when the dialog re-opens.
  React.useEffect(() => {
    if (open) {
      setError(null);
      setLatestUrl(null);
      setCopied(false);
    }
  }, [open]);

  const onGenerate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await createShare({ resourceId: projectId, expiresIn: expiry });
      setLatestUrl(res.url);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const onCopy = async () => {
    if (!latestUrl) return;
    await navigator.clipboard.writeText(latestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const onRevoke = async (token: string) => {
    try {
      await revokeShare(token);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Share “{projectName}”
          </DialogTitle>
          <DialogDescription>
            Anyone with the link can view project details and inventory —
            no account required. Revoke at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Expiry picker */}
          <div className="space-y-2">
            <span className="text-label uppercase tracking-wider text-muted-foreground">
              Link expires
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPIRY_OPTIONS.map((opt) => {
                const active = expiry === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExpiry(opt.id)}
                    className={[
                      "rounded-md border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-gcpallet-primary bg-gcpallet-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    ].join(" ")}
                  >
                    <div className="text-body-strong">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" /> Generate public link
              </>
            )}
          </Button>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {latestUrl && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{latestUrl}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Active shares list */}
          <div className="space-y-2">
            <span className="text-label uppercase tracking-wider text-muted-foreground">
              Active links
            </span>
            <SharesList shares={shares} onRevoke={onRevoke} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
