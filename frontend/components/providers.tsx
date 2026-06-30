"use client";
import * as React from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 1000 }}>
        <Toaster />
        {children}
      </SWRConfig>
    </ThemeProvider>
  );
}