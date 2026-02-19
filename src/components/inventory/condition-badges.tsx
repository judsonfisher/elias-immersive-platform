"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const conditionConfig = {
  EXCELLENT: { label: "Excellent", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  GOOD: { label: "Good", className: "border-blue-300 bg-blue-50 text-blue-700" },
  FAIR: { label: "Fair", className: "border-amber-300 bg-amber-50 text-amber-700" },
  POOR: { label: "Poor", className: "border-red-300 bg-red-50 text-red-700" },
} as const;

interface ConditionBadgeProps {
  condition: keyof typeof conditionConfig;
  size?: "sm" | "md";
}

export function ConditionBadge({ condition, size = "sm" }: ConditionBadgeProps) {
  const config = conditionConfig[condition];
  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" ? "text-xs" : "text-sm"
      )}
    >
      {config.label}
    </Badge>
  );
}
