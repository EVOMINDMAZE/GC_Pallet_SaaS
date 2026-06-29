"use client";
import * as React from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 1000 }}>
      <Toaster />
      {children}
    </SWRConfig>
  );
}
