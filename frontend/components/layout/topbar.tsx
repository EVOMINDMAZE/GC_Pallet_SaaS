"use client";
import * as React from "react";
import { UserMenu } from "./user-menu";

/**
 * Topbar. The greeting and user menu read from the auth context, so
 * the layout server-render must not show their text — otherwise we
 * get a hydration mismatch (server has no user). The components
 * themselves handle that with mounted-guards.
 */
export function Topbar() {
  // Mounted-guard: prevents a hydration mismatch when the user is
  // signed in (server sees no auth) and the client immediately
  // shows <UserMenu />.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-4">
      {mounted ? <UserMenu /> : <div className="h-9 w-9" />}
    </header>
  );
}
