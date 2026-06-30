import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  recovery?: { label: string; onClick?: () => void } | React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  recovery,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-destructive-soft bg-destructive-soft/30 py-10 px-6 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-white">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-h3 font-semibold text-destructive-foreground_soft">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm text-slate-700">{message}</p>}
      {recovery && (
        <div className="mt-4">
          {React.isValidElement(recovery) ? (
            recovery
          ) : (
            typeof recovery === "object" &&
            recovery !== null &&
            "label" in recovery && (
              <Button variant="outline" onClick={(recovery as any).onClick}>
                {(recovery as any).label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
