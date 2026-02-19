"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsCards } from "./stats-cards";
import { EngagementChart } from "./engagement-chart";
import { TagTable } from "./tag-table";
import { HeatmapOverlay } from "./heatmap-overlay";
import { SessionTimeline } from "./session-timeline";
import { DwellZones } from "./dwell-zones";
import { DateRangePicker, dateRangeToISO, type DateRange } from "./date-range-picker";
import { SampleDataBadge } from "@/components/dashboard/sample-data-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsSummary, getHeatmapData, getTagData } from "@/actions/analytics";
import type { AnalyticsSummary, HeatmapData, TagData } from "@/lib/matterport";

interface AnalyticsDashboardProps {
  propertyId: string;
  propertyName: string;
  isMock: boolean;
}

export function AnalyticsDashboard({
  propertyId,
  propertyName,
  isMock,
}: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [tags, setTags] = useState<TagData[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = dateRangeToISO(dateRange);
      const timeRange = dateRange === "7d" ? "WEEK" : dateRange === "30d" ? "MONTH" : dateRange === "90d" ? "MONTH" : "ALL";

      const [summaryData, heatmapData, tagData] = await Promise.all([
        getAnalyticsSummary(propertyId, startDate, endDate),
        getHeatmapData(propertyId, timeRange),
        getTagData(propertyId),
      ]);

      setSummary(summaryData);
      setHeatmap(heatmapData);
      setTags(tagData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            Analytics
          </h2>
          <SampleDataBadge show={isMock} />
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {loading ? (
        <AnalyticsLoadingSkeleton />
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <StatsCards summary={summary} />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EngagementChart sessionsOverTime={summary.sessionsOverTime} />
            <DwellZones deviceBreakdown={summary.deviceBreakdown} />
          </div>

          {/* Heatmap */}
          {heatmap && <HeatmapOverlay heatmap={heatmap} />}

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SessionTimeline topTags={summary.topTags} />
            <TagTable tags={tags} />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            No Matterport scans found for {propertyName}. Add a Matterport scan
            to start tracking analytics.
          </p>
        </div>
      )}
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
