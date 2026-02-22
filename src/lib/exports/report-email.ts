import { APP_NAME, APP_URL } from "@/lib/constants";
import type { AnalyticsSummary } from "@/lib/matterport/types";

/**
 * Generate an HTML email body for an analytics report.
 */
export function generateReportEmailHtml(opts: {
  organizationName: string;
  propertyName: string;
  propertyId: string;
  summary: AnalyticsSummary;
  frequency: "WEEKLY" | "MONTHLY";
  periodLabel: string;
}): string {
  const { organizationName, propertyName, propertyId, summary, frequency, periodLabel } = opts;
  const dashboardUrl = `${APP_URL}/properties/${propertyId}/analytics`;

  const topTagsHtml = summary.topTags
    .slice(0, 5)
    .map(
      (tag) =>
        `<tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e0e0dc; font-size: 14px; color: #1a1a1a;">${tag.label}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #e0e0dc; font-size: 14px; color: #666666; text-align: right;">${tag.totalClicks} clicks</td>
        </tr>`
    )
    .join("");

  const deviceBreakdownHtml = summary.deviceBreakdown
    .map(
      (d) =>
        `<span style="display: inline-block; margin-right: 16px; font-size: 13px; color: #666666;">
          ${d.device}: <strong style="color: #1a1a1a;">${d.percentage.toFixed(0)}%</strong>
        </span>`
    )
    .join("");

  const avgDurationMin = Math.floor(summary.avgSessionDuration / 60);
  const avgDurationSec = Math.round(summary.avgSessionDuration % 60);
  const durationStr =
    avgDurationMin > 0
      ? `${avgDurationMin}m ${avgDurationSec}s`
      : `${avgDurationSec}s`;

  return `
    <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 22px; color: #1a1a1a; margin: 0;">${frequency === "WEEKLY" ? "Weekly" : "Monthly"} Analytics Report</h1>
        <p style="font-size: 14px; color: #999999; margin: 8px 0 0 0;">${periodLabel}</p>
      </div>

      <div style="background: #f8f7f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #999999; margin: 0 0 4px 0;">${organizationName}</p>
        <p style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0;">${propertyName}</p>
      </div>

      <!-- Key Metrics -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e0e0dc; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 24px; font-weight: 700; color: #4a5440;">${summary.totalSessions}</div>
            <div style="font-size: 11px; color: #999999; margin-top: 4px;">Sessions</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e0e0dc; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 24px; font-weight: 700; color: #4a5440;">${summary.totalUniqueVisitors}</div>
            <div style="font-size: 11px; color: #999999; margin-top: 4px;">Visitors</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e0e0dc; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 24px; font-weight: 700; color: #4a5440;">${durationStr}</div>
            <div style="font-size: 11px; color: #999999; margin-top: 4px;">Avg Duration</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e0e0dc; border-radius: 8px; text-align: center; width: 25%;">
            <div style="font-size: 24px; font-weight: 700; color: #4a5440;">${summary.totalTagClicks}</div>
            <div style="font-size: 11px; color: #999999; margin-top: 4px;">Tag Clicks</div>
          </td>
        </tr>
      </table>

      <!-- Device Breakdown -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #1a1a1a; margin: 0 0 8px 0;">Device Breakdown</h3>
        <div>${deviceBreakdownHtml || '<span style="font-size: 13px; color: #999999;">No data</span>'}</div>
      </div>

      <!-- Top Tags -->
      ${
        summary.topTags.length > 0
          ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; color: #1a1a1a; margin: 0 0 8px 0;">Top Tags</h3>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e0e0dc; border-radius: 8px; overflow: hidden;">
          ${topTagsHtml}
        </table>
      </div>
      `
          : ""
      }

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #4a5440; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 500;">
          View Full Analytics
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e0e0dc; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999999; text-align: center;">
        ${APP_NAME} — Precision Capture. Interactive Results.
      </p>
    </div>
  `;
}
