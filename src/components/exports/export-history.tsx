"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table2, BarChart3 } from "lucide-react";
import type { ExportJob } from "@prisma/client";

interface ExportHistoryProps {
  jobs: ExportJob[];
}

const TYPE_CONFIG = {
  INVENTORY_PDF: { label: "Inventory PDF", icon: FileText },
  INVENTORY_CSV: { label: "Inventory CSV", icon: Table2 },
  ANALYTICS_PDF: { label: "Analytics PDF", icon: BarChart3 },
  ANALYTICS_CSV: { label: "Analytics CSV", icon: Table2 },
} as const;

const STATUS_BADGE = {
  PENDING: { label: "Pending", variant: "secondary" as const },
  PROCESSING: { label: "Processing", variant: "secondary" as const },
  COMPLETED: { label: "Completed", variant: "default" as const },
  FAILED: { label: "Failed", variant: "destructive" as const },
} as const;

export function ExportHistory({ jobs }: ExportHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Export History</CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No exports yet. Use the export button above to generate reports.
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const typeConfig = TYPE_CONFIG[job.type];
              const statusConfig = STATUS_BADGE[job.status];
              const Icon = typeConfig.icon;

              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{typeConfig.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig.variant} className="text-xs">
                      {statusConfig.label}
                    </Badge>
                    {job.status === "COMPLETED" && job.fileUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={job.fileUrl}
                          download={`export-${job.type.toLowerCase()}.${job.type.includes("CSV") ? "csv" : "txt"}`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
