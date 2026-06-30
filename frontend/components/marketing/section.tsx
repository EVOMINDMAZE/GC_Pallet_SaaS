import * as React from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  containerClassName,
  eyebrow,
  title,
  description,
  align = "center",
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 md:px-6",
          align === "center" ? "text-center" : "text-left",
          containerClassName
        )}
      >
        {eyebrow && (
          <p className="text-label uppercase tracking-wider text-gcpallet-primary">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-h1 mt-3 font-bold tracking-tight text-foreground">
            {title}
          </h2>
        )}
        {description && (
          <p
            className={cn(
              "text-body text-gcpallet-muted-foreground mt-4",
              align === "center" && "mx-auto max-w-2xl"
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}