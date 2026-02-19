"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteAsset } from "@/actions/inventory";
import { toast } from "sonner";

interface AssetDeleteButtonProps {
  assetId: string;
  propertyId: string;
}

export function AssetDeleteButton({ assetId, propertyId }: AssetDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    startTransition(async () => {
      const result = await deleteAsset(assetId);
      if (result.success) {
        toast.success("Asset deleted");
        router.push(`/properties/${propertyId}/inventory`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
