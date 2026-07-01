"use client";
import * as React from "react";
import { useAuth } from "@/hooks/useAuth";

export function Greeting() {
  const { user } = useAuth();
  // Defer to post-mount so server (no user, server hour) and first client
  // paint (user loading, client hour) don't trigger a hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const firstName =
    (typeof meta.name === "string" ? meta.name : "")?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";
  if (!mounted) {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Welcome back</span> — here's your operations snapshot.
      </p>
    );
  }
  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return (
    <p className="text-sm text-muted-foreground">
      Good {partOfDay}, <span className="font-semibold text-foreground">{firstName}</span> — here's your operations snapshot.
    </p>
  );
}
