import type {
  AnalyticsSummary,
  SessionData,
  SessionEvent,
  HeatmapData,
  HeatmapPoint,
  PeakZone,
  TagData,
} from "./types";

// ─── Deterministic Random ───────────────────────────────────────────

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function randomBetween(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ─── Mock Tags ──────────────────────────────────────────────────────

const TAG_TEMPLATES = [
  { label: "Main Entrance", category: "Navigation" },
  { label: "Reception Desk", category: "Navigation" },
  { label: "Conference Room A", category: "Navigation" },
  { label: "Kitchen Area", category: "Navigation" },
  { label: "Product Display", category: "Point of Interest" },
  { label: "Emergency Exit", category: "Safety" },
  { label: "Restrooms", category: "Navigation" },
  { label: "Stage Area", category: "Point of Interest" },
  { label: "VIP Lounge", category: "Point of Interest" },
  { label: "Bar Counter", category: "Point of Interest" },
  { label: "Outdoor Patio", category: "Navigation" },
  { label: "Storage Room", category: "Utility" },
];

export function generateMockTags(scanId: string): TagData[] {
  const rand = seededRandom(scanId + "tags");
  const count = randomBetween(rand, 5, 10);

  return TAG_TEMPLATES.slice(0, count).map((template, i) => ({
    id: `tag-${scanId}-${i}`,
    tagId: `mp-tag-${i}`,
    label: template.label,
    category: template.category,
    position: {
      x: rand() * 20 - 10,
      y: rand() * 5,
      z: rand() * 20 - 10,
    },
    totalClicks: randomBetween(rand, 5, 200),
    totalDwellTime: randomBetween(rand, 30, 600),
  }));
}

// ─── Mock Sessions ──────────────────────────────────────────────────

const DEVICES = ["Desktop", "Mobile", "Tablet"];

export function generateMockSessions(
  scanId: string,
  startDate: Date,
  endDate: Date
): SessionData[] {
  const rand = seededRandom(scanId + startDate.toISOString());
  const dayCount = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const sessionCount = randomBetween(rand, dayCount * 2, dayCount * 8);

  const sessions: SessionData[] = [];

  for (let i = 0; i < sessionCount; i++) {
    const sessionStart = new Date(
      startDate.getTime() +
        rand() * (endDate.getTime() - startDate.getTime())
    );
    const duration = randomBetween(rand, 30, 900); // 30s to 15min
    const sessionEnd = new Date(
      sessionStart.getTime() + duration * 1000
    );

    const eventCount = randomBetween(rand, 3, 20);
    const events: SessionEvent[] = [];

    for (let j = 0; j < eventCount; j++) {
      const types = [
        "MOVE",
        "ZOOM",
        "TAG_CLICK",
        "HOTSPOT_CLICK",
        "DWELL",
      ] as const;
      const type = types[randomBetween(rand, 0, types.length - 1)];

      events.push({
        id: `event-${i}-${j}`,
        type,
        timestamp: new Date(
          sessionStart.getTime() +
            (j / eventCount) * duration * 1000
        ),
        position:
          type === "MOVE" || type === "DWELL"
            ? {
                x: rand() * 20 - 10,
                y: rand() * 5,
                z: rand() * 20 - 10,
              }
            : null,
        targetId:
          type === "TAG_CLICK"
            ? `mp-tag-${randomBetween(rand, 0, 9)}`
            : null,
        metadata: null,
        duration: type === "DWELL" ? randomBetween(rand, 5, 60) : null,
      });
    }

    sessions.push({
      id: `session-${scanId}-${i}`,
      visitorId: `visitor-${randomBetween(rand, 1, sessionCount * 0.7)}`,
      startedAt: sessionStart,
      endedAt: sessionEnd,
      duration,
      deviceType: DEVICES[randomBetween(rand, 0, DEVICES.length - 1)],
      entryPoint: "Direct",
      totalMoves: events.filter((e) => e.type === "MOVE").length,
      totalZooms: events.filter((e) => e.type === "ZOOM").length,
      events,
    });
  }

  return sessions.sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );
}

// ─── Mock Heatmap ───────────────────────────────────────────────────

export function generateMockHeatmap(
  scanId: string,
  timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
): HeatmapData {
  const rand = seededRandom(scanId + timeRange);

  const pointCount = randomBetween(rand, 50, 200);
  const dataPoints: HeatmapPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    dataPoints.push({
      x: rand() * 100,
      y: rand() * 100,
      intensity: rand() * rand(), // Cluster toward lower intensities
    });
  }

  // Add some hotspots (higher intensity clusters)
  const hotspotCount = randomBetween(rand, 2, 5);
  for (let i = 0; i < hotspotCount; i++) {
    const cx = rand() * 80 + 10;
    const cy = rand() * 80 + 10;
    for (let j = 0; j < 15; j++) {
      dataPoints.push({
        x: cx + (rand() - 0.5) * 15,
        y: cy + (rand() - 0.5) * 15,
        intensity: 0.6 + rand() * 0.4,
      });
    }
  }

  const peakZones: PeakZone[] = [];
  const zoneLabels = [
    "Main Entrance",
    "Product Display",
    "Stage Area",
    "Bar Counter",
    "VIP Section",
  ];

  for (let i = 0; i < hotspotCount; i++) {
    peakZones.push({
      label: zoneLabels[i % zoneLabels.length],
      position: {
        x: rand() * 20 - 10,
        y: rand() * 3,
        z: rand() * 20 - 10,
      },
      radius: randomBetween(rand, 2, 5),
      intensity: 0.6 + rand() * 0.4,
    });
  }

  return {
    id: `heatmap-${scanId}-${timeRange}`,
    generatedAt: new Date(),
    timeRange,
    dataPoints,
    peakZones,
  };
}

// ─── Mock Analytics Summary ─────────────────────────────────────────

export function generateMockAnalyticsSummary(
  scanId: string,
  startDate: Date,
  endDate: Date
): AnalyticsSummary {
  const sessions = generateMockSessions(scanId, startDate, endDate);
  const tags = generateMockTags(scanId);
  const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
  const avgDuration =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
      : 0;
  const totalTagClicks = tags.reduce((sum, t) => sum + t.totalClicks, 0);

  // Device breakdown
  const deviceCounts = new Map<string, number>();
  sessions.forEach((s) => {
    deviceCounts.set(s.deviceType, (deviceCounts.get(s.deviceType) || 0) + 1);
  });
  const deviceBreakdown = Array.from(deviceCounts.entries()).map(
    ([device, count]) => ({
      device,
      count,
      percentage: sessions.length > 0 ? (count / sessions.length) * 100 : 0,
    })
  );

  // Sessions over time (daily)
  const dayMap = new Map<string, number>();
  sessions.forEach((s) => {
    const day = s.startedAt.toISOString().split("T")[0];
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  const sessionsOverTime = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSessions: sessions.length,
    totalUniqueVisitors: uniqueVisitors,
    avgSessionDuration: Math.round(avgDuration),
    totalTagClicks,
    topTags: [...tags].sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 5),
    deviceBreakdown,
    sessionsOverTime,
  };
}
