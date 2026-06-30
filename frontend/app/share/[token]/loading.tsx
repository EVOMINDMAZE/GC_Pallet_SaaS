import { Clock } from "lucide-react";

export default function ShareLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-32 rounded-lg border border-border bg-muted/40" />
        <div className="h-64 rounded-lg border border-border bg-muted/40" />
      </div>
    </div>
  );
}
