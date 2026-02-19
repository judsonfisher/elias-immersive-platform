import { prisma } from "@/lib/prisma";

/**
 * Generate a CSV export of inventory items for a property.
 * Returns a data: URI containing the CSV content.
 */
export async function generateInventoryCSV(
  propertyId: string,
  propertyName: string
): Promise<string> {
  const assets = await prisma.assetItem.findMany({
    where: { propertyId, isActive: true },
    orderBy: [{ roomName: "asc" }, { name: "asc" }],
  });

  const headers = [
    "Room",
    "Item Name",
    "Category",
    "Condition",
    "Brand",
    "Model",
    "Serial Number",
    "Purchase Date",
    "Purchase Price",
    "Estimated Value",
    "Description",
    "Notes",
  ];

  const rows = assets.map((asset) => [
    asset.roomName,
    asset.name,
    asset.category,
    asset.condition,
    asset.brand || "",
    asset.model || "",
    asset.serialNumber || "",
    asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "",
    asset.purchasePrice?.toString() || "",
    asset.estimatedValue?.toString() || "",
    (asset.description || "").replace(/"/g, '""'),
    (asset.notes || "").replace(/"/g, '""'),
  ]);

  const csvContent = [
    `# Asset Inventory — ${propertyName}`,
    `# Generated: ${new Date().toLocaleString()}`,
    `# Total Items: ${assets.length}`,
    "",
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Return as data URI — in production this would upload to a storage service
  const base64 = Buffer.from(csvContent).toString("base64");
  return `data:text/csv;base64,${base64}`;
}
