"use client";
import * as React from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface ToastEventDetail {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
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
          <div className="grid gap-1">
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

export function toast(opts: { title?: string; description?: string; variant?: "default" | "destructive" }) {
  if (typeof window === "undefined" || !add) return;
  add({ ...opts, id: crypto.randomUUID() });
}
