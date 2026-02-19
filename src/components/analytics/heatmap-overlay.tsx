"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HeatmapData } from "@/lib/matterport";

interface HeatmapOverlayProps {
  heatmap: HeatmapData;
}

/**
 * Visual heatmap overlay rendered as CSS-positioned circles.
 * In a real implementation, this would overlay on the Matterport viewport.
 */
export function HeatmapOverlay({ heatmap }: HeatmapOverlayProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Engagement Heatmap</CardTitle>
        <Badge variant="outline" className="text-xs capitalize">
          {heatmap.timeRange.toLowerCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Heatmap visualization */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "10% 10%",
            }}
          />

          {/* Heatmap points */}
          {heatmap.dataPoints.map((point, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                width: `${8 + point.intensity * 16}px`,
                height: `${8 + point.intensity * 16}px`,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, rgba(239, 68, 68, ${point.intensity * 0.6}) 0%, rgba(239, 68, 68, 0) 70%)`,
              }}
            />
          ))}

          {/* Placeholder text */}
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <p className="rounded bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {heatmap.dataPoints.length} data points
            </p>
          </div>
        </div>

        {/* Peak zones */}
        {heatmap.peakZones.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Peak Zones</p>
            <div className="flex flex-wrap gap-2">
              {heatmap.peakZones.map((zone, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: `rgba(239, 68, 68, ${zone.intensity})`,
                    }}
                  />
                  {zone.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
