"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteScan } from "@/actions/scans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScanLine, Trash2, Pencil, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface Scan {
  id: string;
  name: string;
  type: "MATTERPORT" | "NIRA";
  embedUrl: string;
  description: string | null;
}

interface ScanListProps {
  scans: Scan[];
  orgId: string;
  propertyId: string;
}

export function ScanList({ scans, orgId, propertyId }: ScanListProps) {
  if (scans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <ScanLine className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">
          No scans yet. Add a Matterport or Nira scan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scans.map((scan) => (
        <ScanRow key={scan.id} scan={scan} orgId={orgId} propertyId={propertyId} />
      ))}
    </div>
  );
}

function ScanRow({
  scan,
  orgId,
  propertyId,
}: {
  scan: Scan;
  orgId: string;
  propertyId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteScan(scan.id);
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <ScanLine className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{scan.name}</p>
            <Badge variant="secondary" className="text-xs">
              {scan.type === "MATTERPORT" ? "Matterport" : "Nira"}
            </Badge>
          </div>
          {scan.description && (
            <p className="text-sm text-muted-foreground">{scan.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild>
          <a
            href={scan.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open scan URL"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/admin/customers/${orgId}/properties/${propertyId}/scans/${scan.id}/edit`}
            title="Edit scan"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Delete scan">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Scan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{scan.name}&rdquo;? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
