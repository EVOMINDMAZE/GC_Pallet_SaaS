import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
  className?: string;
}) {
  const inner = (
    <Card className={cn("h-full transition hover:shadow-lg", className)}>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gcpallet-accent text-gcpallet-accent-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-2">
          <h3 className="text-h3 font-semibold text-gcpallet-card-foreground">{title}</h3>
          <p className="text-body text-gcpallet-muted-foreground">{description}</p>
        </div>
        {href && (
          <span className="mt-auto inline-flex items-center gap-1 text-body-strong text-gcpallet-primary">
            Learn more
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </CardContent>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block focus-ring rounded-lg">
        {inner}
      </Link>
    );
  }
  return inner;
}