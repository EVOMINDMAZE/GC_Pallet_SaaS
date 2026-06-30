"use client";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

type ToastVariant = "default" | "success" | "warning" | "info" | "destructive";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success: "border-success/30 bg-success-soft text-success-soft-foreground",
        warning: "border-warning/40 bg-warning-soft text-warning-soft-foreground",
        info: "border-info/30 bg-info-soft text-info-soft-foreground",
        destructive: "border-destructive/40 bg-destructive-soft text-destructive-soft-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = ToastPrimitives.Root.displayName;

function VariantIcon({ variant }: { variant?: ToastVariant }) {
  const cls = "h-5 w-5 shrink-0";
  switch (variant) {
    case "success":
      return <CheckCircle2 className={cn(cls, "text-success")} />;
    case "warning":
      return <AlertTriangle className={cn(cls, "text-warning")} />;
    case "info":
      return <Info className={cn(cls, "text-info")} />;
    case "destructive":
      return <AlertCircle className={cn(cls, "text-destructive")} />;
    default:
      return <Bell className={cn(cls, "text-muted-foreground")} />;
  }
}

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>((props, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-body-strong", (props as { className?: string }).className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>((props, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90 leading-relaxed", (props as { className?: string }).className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1 top-1 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-gcpallet-primary",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  VariantIcon,
  type ToastVariant,
};
