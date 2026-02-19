import { prisma } from "@/lib/prisma";

/**
 * Generate a mock PDF export of inventory items.
 * In production, this would use a PDF library (e.g., @react-pdf/renderer).
 * For now, returns a text-based summary as a data URI.
 */
export async function generateInventoryPDF(
  propertyId: string,
  propertyName: string
): Promise<string> {
  const assets = await prisma.assetItem.findMany({
    where: { propertyId, isActive: true },
    orderBy: [{ roomName: "asc" }, { name: "asc" }],
  });

  const totalValue = assets.reduce(
    (sum, a) => sum + (a.estimatedValue || 0),
    0
  );

  // Group by room
  const roomGroups = new Map<string, typeof assets>();
  assets.forEach((asset) => {
    const group = roomGroups.get(asset.roomName) || [];
    group.push(asset);
    roomGroups.set(asset.roomName, group);
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  // Build a text representation (mock PDF)
  const lines = [
    "═══════════════════════════════════════════════════",
    `  ASSET INVENTORY REPORT`,
    `  ${propertyName}`,
    `  Generated: ${new Date().toLocaleString()}`,
    "═══════════════════════════════════════════════════",
    "",
    `  Total Items: ${assets.length}`,
    `  Total Estimated Value: ${formatCurrency(totalValue)}`,
    "",
  ];

  for (const [room, items] of roomGroups) {
    const roomValue = items.reduce(
      (sum, a) => sum + (a.estimatedValue || 0),
      0
    );
    lines.push("───────────────────────────────────────────────────");
    lines.push(`  ${room.toUpperCase()} (${items.length} items — ${formatCurrency(roomValue)})`);
    lines.push("───────────────────────────────────────────────────");

    items.forEach((item, i) => {
      lines.push(`  ${i + 1}. ${item.name}`);
      if (item.brand) lines.push(`     Brand: ${item.brand}${item.model ? ` ${item.model}` : ""}`);
      if (item.serialNumber) lines.push(`     S/N: ${item.serialNumber}`);
      lines.push(`     Condition: ${item.condition}`);
      if (item.estimatedValue) lines.push(`     Value: ${formatCurrency(item.estimatedValue)}`);
      if (item.notes) lines.push(`     Notes: ${item.notes}`);
      lines.push("");
    });
  }

  lines.push("═══════════════════════════════════════════════════");
  lines.push("  End of Report");
  lines.push("  This is a sample report. PDF generation will be");
  lines.push("  available with the full Matterport SDK integration.");
  lines.push("═══════════════════════════════════════════════════");

  const content = lines.join("\n");
  const base64 = Buffer.from(content).toString("base64");
  return `data:text/plain;base64,${base64}`;
}
