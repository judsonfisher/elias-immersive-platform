import type {
  MatterportSDK,
  AnalyticsSummary,
  SessionData,
  HeatmapData,
  TagData,
} from "./types";

/**
 * Real Matterport SDK stub. This will be implemented when
 * Matterport API credentials are configured.
 *
 * For now, all methods throw a descriptive error.
 */
export class RealMatterportSDK implements MatterportSDK {
  readonly isMock = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAnalyticsSummary(
    _scanId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<AnalyticsSummary> {
    throw new Error(
      "Matterport SDK is not configured. Set MATTERPORT_API_KEY and MATTERPORT_SDK_KEY in your environment variables."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSessions(
    _scanId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<SessionData[]> {
    throw new Error(
      "Matterport SDK is not configured. Set MATTERPORT_API_KEY and MATTERPORT_SDK_KEY in your environment variables."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHeatmap(
    _scanId: string,
    _timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
  ): Promise<HeatmapData> {
    throw new Error(
      "Matterport SDK is not configured. Set MATTERPORT_API_KEY and MATTERPORT_SDK_KEY in your environment variables."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTags(_scanId: string): Promise<TagData[]> {
    throw new Error(
      "Matterport SDK is not configured. Set MATTERPORT_API_KEY and MATTERPORT_SDK_KEY in your environment variables."
    );
  }
}
