"use client";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Upload } from "lucide-react";
import { getPocketBase } from "@/lib/pocketbase";
import { toastVariants_enum as toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/format";
import type { DocumentsRecord } from "@/lib/types";

const CATEGORY_VARIANT: Record<string, "primary" | "info" | "warning" | "success" | "secondary" | "destructive"> = {
  contract: "primary",
  permit: "info",
  invoice: "warning",
  receipt: "secondary",
  photo: "info",
  other: "secondary",
};

export function DocumentList({ documents, onUpload }: { documents: DocumentsRecord[]; onUpload?: () => void }) {
  const router = useRouter();
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="No documents uploaded yet"
        description="Permit packages, contracts, and photos live here once you upload them."
        action={
          onUpload && (
            <Button onClick={onUpload} variant="primary">
              <Upload className="h-4 w-4" /> Upload first file
            </Button>
          )
        }
      />
    );
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await getPocketBase().collection("documents").delete(id);
      toast.success("Deleted");
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast.destructive("Error", err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-gcpallet-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gcpallet-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((d) => (
            <TableRow key={d.id} className="hover:bg-gcpallet-muted/40">
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {d.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={CATEGORY_VARIANT[d.category] ?? "secondary"}>
                  {d.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(d.uploaded_at)}</TableCell>
              <TableCell className="space-x-2 text-right">
                <a href={getPocketBase().files.getUrl(d, d.file)} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </a>
                <Button size="sm" variant="destructive" onClick={() => onDelete(d.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
