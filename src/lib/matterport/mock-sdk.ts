import type {
  MatterportSDK,
  AnalyticsSummary,
  SessionData,
  HeatmapData,
  TagData,
} from "./types";
import {
  generateMockAnalyticsSummary,
  generateMockSessions,
  generateMockHeatmap,
  generateMockTags,
} from "./mock-data";

/**
 * Mock Matterport SDK that returns deterministic fake data.
 * Used when NEXT_PUBLIC_MATTERPORT_MODE !== "live" (the default).
 */
export class MockMatterportSDK implements MatterportSDK {
  readonly isMock = true;

  async getAnalyticsSummary(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsSummary> {
    // Simulate network delay
    await delay(300);
    return generateMockAnalyticsSummary(scanId, startDate, endDate);
  }

  async getSessions(
    scanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SessionData[]> {
    await delay(200);
    return generateMockSessions(scanId, startDate, endDate);
  }

  async getHeatmap(
    scanId: string,
    timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
  ): Promise<HeatmapData> {
    await delay(400);
    return generateMockHeatmap(scanId, timeRange);
  }

  async getTags(scanId: string): Promise<TagData[]> {
    await delay(150);
    return generateMockTags(scanId);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
