"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { DocumentsRecord } from "@/lib/types";

export function useDocuments(opts?: { projectId?: string; uploadedAfter?: string }) {
  const pb = getPocketBase();
  const { projectId, uploadedAfter } = opts ?? {};
  const key = (projectId || uploadedAfter)
    ? ["documents", projectId ?? "_", uploadedAfter ?? "_"]
    : "documents";
  return useSWR<DocumentsRecord[]>(key, async () => {
    const parts: string[] = [];
    if (projectId) parts.push(`project="${projectId}"`);
    if (uploadedAfter) parts.push(`uploaded_at >= "${uploadedAfter}"`);
    const filter = parts.join(" && ");
    return (await pb.collection("documents").getFullList({
      sort: "-uploaded_at",
      filter,
    })) as DocumentsRecord[];
  });
}
