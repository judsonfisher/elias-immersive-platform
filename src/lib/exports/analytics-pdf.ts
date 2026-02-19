import { getMatterportSDK } from "@/lib/matterport";

/**
 * Generate a mock analytics PDF report.
 * In production, this would create a real PDF with charts.
 */
export async function generateAnalyticsPDF(
  propertyId: string,
  propertyName: string
): Promise<string> {
  // Use the mock SDK to get sample data
  const sdk = getMatterportSDK();
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const summary = await sdk.getAnalyticsSummary(
    propertyId,
    startDate,
    endDate
  );

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  const lines = [
    "═══════════════════════════════════════════════════",
    `  SCAN ANALYTICS REPORT`,
    `  ${propertyName}`,
    `  Period: ${startDate.toLocaleDateString()} — ${endDate.toLocaleDateString()}`,
    `  Generated: ${new Date().toLocaleString()}`,
    "═══════════════════════════════════════════════════",
    "",
    "  OVERVIEW",
    "───────────────────────────────────────────────────",
    `  Total Sessions:    ${summary.totalSessions}`,
    `  Unique Visitors:   ${summary.totalUniqueVisitors}`,
    `  Avg. Duration:     ${formatDuration(summary.avgSessionDuration)}`,
    `  Total Tag Clicks:  ${summary.totalTagClicks}`,
    "",
    "  DEVICE BREAKDOWN",
    "───────────────────────────────────────────────────",
  ];

  summary.deviceBreakdown.forEach((d) => {
    lines.push(
      `  ${d.device.padEnd(12)} ${d.count.toString().padStart(5)} (${Math.round(d.percentage)}%)`
    );
  });

  lines.push("");
  lines.push("  TOP TAGS BY ENGAGEMENT");
  lines.push("───────────────────────────────────────────────────");

  summary.topTags.forEach((tag, i) => {
    lines.push(`  ${i + 1}. ${tag.label} — ${tag.totalClicks} clicks`);
  });

  lines.push("");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("  End of Report");
  lines.push("  This is a sample report. Full PDF generation");
  lines.push("  will be available with Matterport SDK integration.");
  lines.push("═══════════════════════════════════════════════════");

  const content = lines.join("\n");
  const base64 = Buffer.from(content).toString("base64");
  return `data:text/plain;base64,${base64}`;
}
