"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { createExport } from "@/actions/exports";
import { toast } from "sonner";
import { FeatureKey } from "@prisma/client";

interface ExportButtonProps {
  propertyId: string;
  enabledFeatures: FeatureKey[];
}

const EXPORT_OPTIONS = [
  { value: "INVENTORY_PDF", label: "Inventory Report (PDF)", feature: "INVENTORY" as FeatureKey },
  { value: "INVENTORY_CSV", label: "Inventory Data (CSV)", feature: "INVENTORY" as FeatureKey },
  { value: "ANALYTICS_PDF", label: "Analytics Report (PDF)", feature: "ANALYTICS" as FeatureKey },
  { value: "ANALYTICS_CSV", label: "Analytics Data (CSV)", feature: "ANALYTICS" as FeatureKey },
];

export function ExportButton({ propertyId, enabledFeatures }: ExportButtonProps) {
  const [type, setType] = useState("");
  const [isPending, startTransition] = useTransition();

  const availableOptions = EXPORT_OPTIONS.filter((opt) =>
    enabledFeatures.includes(opt.feature)
  );

  function handleExport() {
    if (!type) {
      toast.error("Select an export format");
      return;
    }

    startTransition(async () => {
      const result = await createExport({ type, propertyId });
      if (result.success && result.fileUrl) {
        toast.success("Export ready! Starting download...");
        // Trigger download
        const link = document.createElement("a");
        link.href = result.fileUrl;
        link.download = `export-${type.toLowerCase()}-${Date.now()}${type.includes("CSV") ? ".csv" : ".txt"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(result.error || "Export failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select format..." />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleExport} disabled={isPending || !type} size="sm">
        <Download className="mr-2 h-4 w-4" />
        {isPending ? "Generating..." : "Export"}
      </Button>
    </div>
  );
}
