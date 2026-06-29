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
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/format";
import type { DocumentsRecord } from "@/lib/types";

export function DocumentList({ documents }: { documents: DocumentsRecord[] }) {
  const router = useRouter();
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await getPocketBase().collection("documents").delete(id);
      toast({ title: "Deleted" });
      router.refresh();
      location.reload();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="capitalize">{d.category}</TableCell>
            <TableCell>{formatDate(d.uploaded_at)}</TableCell>
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
  );
}
