// ─── Position & Spatial Types ───────────────────────────────────────

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraState {
  position: Position3D;
  rotation: { x: number; y: number };
  fov: number;
}

// ─── Analytics Types ────────────────────────────────────────────────

export interface SessionData {
  id: string;
  visitorId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number;
  deviceType: string;
  entryPoint: string;
  totalMoves: number;
  totalZooms: number;
  events: SessionEvent[];
}

export interface SessionEvent {
  id: string;
  type: "MOVE" | "ZOOM" | "TAG_CLICK" | "HOTSPOT_CLICK" | "DWELL";
  timestamp: Date;
  position: Position3D | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  duration: number | null;
}

export interface TagData {
  id: string;
  tagId: string;
  label: string;
  category: string | null;
  position: Position3D | null;
  totalClicks: number;
  totalDwellTime: number;
}

export interface HeatmapData {
  id: string;
  generatedAt: Date;
  timeRange: "DAY" | "WEEK" | "MONTH" | "ALL";
  dataPoints: HeatmapPoint[];
  peakZones: PeakZone[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
}

export interface PeakZone {
  label: string;
  position: Position3D;
  radius: number;
  intensity: number;
}

// ─── Analytics Summary ──────────────────────────────────────────────

export interface AnalyticsSummary {
  totalSessions: number;
  totalUniqueVisitors: number;
  avgSessionDuration: number; // seconds
  totalTagClicks: number;
  topTags: TagData[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  sessionsOverTime: { date: string; count: number }[];
}

// ─── SDK Interface ──────────────────────────────────────────────────

export interface MatterportSDK {
  /**
   * Get analytics summary for a scan within a date range.
   */
  getAnalyticsSummary(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsSummary>;

  /**
   * Get sessions for a scan within a date range.
   */
  getSessions(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SessionData[]>;

  /**
   * Get heatmap data for a scan.
   */
  getHeatmap(
    scanId: string,
    timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
  ): Promise<HeatmapData>;

  /**
   * Get all tracked tags for a scan.
   */
  getTags(scanId: string): Promise<TagData[]>;

  /**
   * Whether this SDK instance uses mock data.
   */
  isMock: boolean;
}
