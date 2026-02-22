import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  MatterportSDK,
  AnalyticsSummary,
  SessionData,
  HeatmapData,
  HeatmapPoint,
  PeakZone,
  TagData,
} from "./types";

const HEATMAP_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Real Matterport SDK implementation.
 * Queries our database (ScanSession, ScanEvent, ScanTag, HeatmapSnapshot)
 * for analytics data captured via the client-side Showcase SDK.
 */
export class RealMatterportSDK implements MatterportSDK {
  readonly isMock = false;

  async getAnalyticsSummary(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsSummary> {
    const sessions = await prisma.scanSession.findMany({
      where: {
        scanId,
        startedAt: { gte: startDate, lte: endDate },
      },
      include: {
        events: {
          where: { type: "TAG_CLICK" },
          select: { targetId: true },
        },
      },
    });

    const totalSessions = sessions.length;
    const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
    const durations = sessions
      .map((s) => s.duration)
      .filter((d): d is number => d !== null);
    const avgSessionDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Total tag clicks from events in range
    const totalTagClicks = sessions.reduce(
      (sum, s) => sum + s.events.length,
      0
    );

    // Device breakdown
    const deviceMap = new Map<string, number>();
    for (const s of sessions) {
      const device = s.deviceType || "Unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    }
    const deviceBreakdown = Array.from(deviceMap.entries()).map(
      ([device, count]) => ({
        device,
        count,
        percentage:
          totalSessions > 0
            ? Math.round((count / totalSessions) * 100)
            : 0,
      })
    );

    // Sessions over time (group by date)
    const dateMap = new Map<string, number>();
    for (const s of sessions) {
      const dateKey = s.startedAt.toISOString().split("T")[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    }
    const sessionsOverTime = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top tags (by click count)
    const tags = await this.getTags(scanId);
    const topTags = tags
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 10);

    return {
      totalSessions,
      totalUniqueVisitors: uniqueVisitors,
      avgSessionDuration,
      totalTagClicks,
      topTags,
      deviceBreakdown,
      sessionsOverTime,
    };
  }

  async getSessions(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SessionData[]> {
    const sessions = await prisma.scanSession.findMany({
      where: {
        scanId,
        startedAt: { gte: startDate, lte: endDate },
      },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      visitorId: s.visitorId,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      duration: s.duration ?? 0,
      deviceType: s.deviceType ?? "Unknown",
      entryPoint: s.entryPoint ?? "Direct",
      totalMoves: s.totalMoves,
      totalZooms: s.totalZooms,
      events: s.events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp,
        position:
          e.positionX !== null && e.positionY !== null && e.positionZ !== null
            ? { x: e.positionX, y: e.positionY, z: e.positionZ }
            : null,
        targetId: e.targetId,
        metadata: e.metadata as Record<string, unknown> | null,
        duration: e.duration,
      })),
    }));
  }

  async getHeatmap(
    scanId: string,
    timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
  ): Promise<HeatmapData> {
    // Check for cached snapshot within TTL
    const cached = await prisma.heatmapSnapshot.findFirst({
      where: {
        scanId,
        timeRange,
        generatedAt: { gte: new Date(Date.now() - HEATMAP_CACHE_TTL_MS) },
      },
      orderBy: { generatedAt: "desc" },
    });

    if (cached) {
      return {
        id: cached.id,
        generatedAt: cached.generatedAt,
        timeRange: cached.timeRange,
        dataPoints: cached.dataPoints as unknown as HeatmapPoint[],
        peakZones: (cached.peakZones as unknown as PeakZone[]) ?? [],
      };
    }

    // Generate fresh heatmap from events
    const startDate = this.getStartDate(timeRange);

    const events = await prisma.scanEvent.findMany({
      where: {
        session: { scanId },
        type: { in: ["MOVE", "DWELL"] },
        timestamp: { gte: startDate },
        positionX: { not: null },
        positionZ: { not: null },
      },
      select: {
        positionX: true,
        positionY: true,
        positionZ: true,
        duration: true,
        type: true,
      },
    });

    if (events.length === 0) {
      // Return empty heatmap
      const snapshot = await prisma.heatmapSnapshot.create({
        data: {
          scanId,
          timeRange,
          dataPoints: [] as unknown as Prisma.InputJsonValue,
          peakZones: [] as unknown as Prisma.InputJsonValue,
        },
      });
      return {
        id: snapshot.id,
        generatedAt: snapshot.generatedAt,
        timeRange: snapshot.timeRange,
        dataPoints: [],
        peakZones: [],
      };
    }

    // Project 3D positions to 2D (use X and Z as the floor plane)
    const points = events.map((e) => ({
      x: e.positionX!,
      z: e.positionZ!,
      weight: e.type === "DWELL" ? (e.duration ?? 1) : 1,
    }));

    // Find bounds
    const xValues = points.map((p) => p.x);
    const zValues = points.map((p) => p.z);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    // Grid-based density calculation (20x20 grid)
    const gridSize = 20;
    const grid: number[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(0)
    );

    for (const p of points) {
      const gx = Math.min(
        Math.floor(((p.x - minX) / rangeX) * (gridSize - 1)),
        gridSize - 1
      );
      const gz = Math.min(
        Math.floor(((p.z - minZ) / rangeZ) * (gridSize - 1)),
        gridSize - 1
      );
      grid[gz][gx] += p.weight;
    }

    // Normalize to 0-1
    let maxDensity = 0;
    for (const row of grid) {
      for (const val of row) {
        if (val > maxDensity) maxDensity = val;
      }
    }

    const dataPoints: HeatmapPoint[] = [];
    for (let gz = 0; gz < gridSize; gz++) {
      for (let gx = 0; gx < gridSize; gx++) {
        if (grid[gz][gx] > 0) {
          dataPoints.push({
            x: Math.round((gx / (gridSize - 1)) * 100),
            y: Math.round((gz / (gridSize - 1)) * 100),
            intensity: maxDensity > 0 ? grid[gz][gx] / maxDensity : 0,
          });
        }
      }
    }

    // Find peak zones (cells with intensity > 0.7)
    const peakZones: PeakZone[] = [];
    for (let gz = 0; gz < gridSize; gz++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const intensity =
          maxDensity > 0 ? grid[gz][gx] / maxDensity : 0;
        if (intensity > 0.7) {
          // Map back to original coordinates
          const origX = minX + (gx / (gridSize - 1)) * rangeX;
          const origZ = minZ + (gz / (gridSize - 1)) * rangeZ;
          peakZones.push({
            label: `Zone ${peakZones.length + 1}`,
            position: { x: origX, y: 0, z: origZ },
            radius: Math.max(rangeX, rangeZ) / gridSize,
            intensity,
          });
        }
      }
    }

    // Cache the snapshot
    const snapshot = await prisma.heatmapSnapshot.create({
      data: {
        scanId,
        timeRange,
        dataPoints: dataPoints as unknown as Prisma.InputJsonValue,
        peakZones: peakZones as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: snapshot.id,
      generatedAt: snapshot.generatedAt,
      timeRange: snapshot.timeRange,
      dataPoints,
      peakZones,
    };
  }

  async getTags(scanId: string): Promise<TagData[]> {
    const tags = await prisma.scanTag.findMany({
      where: { scanId, isActive: true },
      orderBy: { totalClicks: "desc" },
    });

    return tags.map((t) => ({
      id: t.id,
      tagId: t.tagId,
      label: t.label,
      category: t.category,
      position:
        t.positionX !== null && t.positionY !== null && t.positionZ !== null
          ? { x: t.positionX, y: t.positionY, z: t.positionZ }
          : null,
      totalClicks: t.totalClicks,
      totalDwellTime: t.totalDwellTime,
    }));
  }

  private getStartDate(timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"): Date {
    const now = new Date();
    switch (timeRange) {
      case "DAY":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "WEEK":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "MONTH":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "ALL":
        return new Date(0);
    }
  }
}
