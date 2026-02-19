"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/lib/matterport";

interface DwellZonesProps {
  deviceBreakdown: AnalyticsSummary["deviceBreakdown"];
}

const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#4a5440",
  Mobile: "#6b7a5e",
  Tablet: "#8c9c7c",
};

/**
 * Device breakdown visualization with horizontal bars.
 */
export function DwellZones({ deviceBreakdown }: DwellZonesProps) {
  const sorted = [...deviceBreakdown].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No device data available.</p>
        ) : (
          sorted.map((device) => (
            <div key={device.device} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{device.device}</span>
                <span className="text-muted-foreground">
                  {device.count} ({Math.round(device.percentage)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${device.percentage}%`,
                    backgroundColor: DEVICE_COLORS[device.device] || "#4a5440",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
