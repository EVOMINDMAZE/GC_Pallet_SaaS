"use client";
import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  VariantIcon,
  type ToastVariant,
} from "./toast";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface ToastEventDetail {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let add: ((t: Omit<ToastItem, "open" | "onOpenChange">) => void) | null = null;

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    add = (t) =>
      setItems((prev) => [
        ...prev,
        { ...t, open: true, onOpenChange: (o) => !o && setItems((p) => p.filter((x) => x.id !== t.id)) },
      ]);
    return () => {
      add = null;
    };
  }, []);

  return (
    <ToastProvider duration={4000}>
      {items.map((t) => (
        <Toast key={t.id} variant={t.variant} open={t.open} onOpenChange={t.onOpenChange}>
          <VariantIcon variant={t.variant} />
          <div className="grid gap-1 flex-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export function toast(opts: {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}) {
  if (typeof window === "undefined" || !add) return;
  add({ ...opts, id: crypto.randomUUID() });
}

export const toastVariants_enum = {
  success: (title: string, description?: string) => toast({ title, description, variant: "success" }),
  warning: (title: string, description?: string) => toast({ title, description, variant: "warning" }),
  info: (title: string, description?: string) => toast({ title, description, variant: "info" }),
  destructive: (title: string, description?: string) => toast({ title, description, variant: "destructive" }),
  default: (title: string, description?: string) => toast({ title, description, variant: "default" }),
};
