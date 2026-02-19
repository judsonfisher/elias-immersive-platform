"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DateRange = "7d" | "30d" | "90d" | "all";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex gap-1">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs",
            value === range.value && "bg-primary/10 text-primary"
          )}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Convert a DateRange value to start/end dates.
 */
export function dateRangeToISO(range: DateRange): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();

  if (range === "all") {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return { startDate: start.toISOString(), endDate };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate };
}
