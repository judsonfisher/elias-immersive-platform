"use client";

import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

interface SampleDataBadgeProps {
  show: boolean;
}

/**
 * Subtle badge indicating the data shown is sample/mock data.
 * Only visible when the Matterport SDK is in mock mode.
 */
export function SampleDataBadge({ show }: SampleDataBadgeProps) {
  if (!show) return null;

  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-300 bg-amber-50 text-amber-700 text-xs font-normal"
    >
      <FlaskConical className="h-3 w-3" />
      Sample Data
    </Badge>
  );
}
