"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { DocumentsRecord } from "@/lib/types";

export function useDocuments(projectId?: string) {
  const pb = getPocketBase();
  return useSWR<DocumentsRecord[]>(
    projectId ? ["documents", projectId] : "documents",
    async () => {
      const filter = projectId ? `project="${projectId}"` : "";
      return (await pb.collection("documents").getFullList({
        sort: "-uploaded_at",
        filter,
      })) as DocumentsRecord[];
    }
  );
}
