"use client";
import * as React from "react";
import { deleteDocument } from "@/hooks/useDocuments";
import type { ProjectDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { Download, Loader2, Trash2 } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  onChanged,
}: {
  documents: ProjectDocument[];
  onChanged?: () => void;
}) {
  const [pending, setPending] = React.useState<string | null>(null);

  const onDelete = async (doc: ProjectDocument) => {
    if (!window.confirm(`Delete document "${doc.name}"?`)) return;
    setPending(doc.id);
    try {
      await deleteDocument(doc.id);
      toast({ title: "Document deleted" });
      onChanged?.();
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No documents yet. Upload the first one above.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.name}</TableCell>
            <TableCell className="capitalize">{doc.category}</TableCell>
            <TableCell className="text-muted-foreground">
              {doc.fileName}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatBytes(doc.sizeBytes)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {doc.downloadUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(doc)}
                  disabled={pending === doc.id}
                  aria-label="Delete document"
                >
                  {pending === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
