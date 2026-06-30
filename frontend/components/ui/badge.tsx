import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// GC Pallet semantic badge variants — soft-fill, dark text, full radius
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gcpallet-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-gcpallet-primary text-gcpallet-primary-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        info: "bg-info-soft text-info-soft-foreground",
        destructive: "bg-destructive-soft text-destructive-soft-foreground",
        secondary: "bg-gcpallet-secondary text-gcpallet-secondary-foreground",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "secondary" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
