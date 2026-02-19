"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, MousePointerClick, Eye } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/matterport";

interface StatsCardsProps {
  summary: AnalyticsSummary;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function StatsCards({ summary }: StatsCardsProps) {
  const stats = [
    {
      label: "Total Sessions",
      value: summary.totalSessions.toLocaleString(),
      icon: Eye,
    },
    {
      label: "Unique Visitors",
      value: summary.totalUniqueVisitors.toLocaleString(),
      icon: Users,
    },
    {
      label: "Avg. Duration",
      value: formatDuration(summary.avgSessionDuration),
      icon: Clock,
    },
    {
      label: "Tag Clicks",
      value: summary.totalTagClicks.toLocaleString(),
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
