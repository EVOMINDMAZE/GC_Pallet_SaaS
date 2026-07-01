"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal Avatar component for shadcn-style. Renders a round badge
 * with a single-letter fallback. No avatar upload UI — we just show
 * the user's initials in the topbar.
 */
export const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
AvatarFallback.displayName = "AvatarFallback";
