"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/lib/matterport";

interface EngagementChartProps {
  sessionsOverTime: AnalyticsSummary["sessionsOverTime"];
}

/**
 * Simple bar chart for sessions over time.
 * Uses CSS-only rendering (no charting library needed).
 */
export function EngagementChart({ sessionsOverTime }: EngagementChartProps) {
  if (sessionsOverTime.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No session data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...sessionsOverTime.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sessions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height: 160 }}>
          {sessionsOverTime.map((day) => {
            const heightPct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div
                key={day.date}
                className="group relative flex-1 min-w-0"
              >
                <div
                  className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                  style={{ height: `${heightPct}%`, minHeight: day.count > 0 ? 4 : 0 }}
                />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                  {day.date}: {day.count} session{day.count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{sessionsOverTime[0]?.date}</span>
          <span>{sessionsOverTime[sessionsOverTime.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}
