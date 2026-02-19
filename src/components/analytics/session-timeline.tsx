"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsSummary } from "@/lib/matterport";

interface SessionTimelineProps {
  topTags: AnalyticsSummary["topTags"];
}

/**
 * Shows the top performing tags ranked by clicks.
 * In a real implementation this could show a timeline replay.
 */
export function SessionTimeline({ topTags }: SessionTimelineProps) {
  const maxClicks = topTags.length > 0 ? topTags[0].totalClicks : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Performing Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tag data available.</p>
        ) : (
          topTags.map((tag, i) => (
            <div key={tag.id} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {tag.label}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {tag.totalClicks} clicks
                  </Badge>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{
                      width: `${(tag.totalClicks / maxClicks) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
