"use server";

import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { getMatterportSDK } from "@/lib/matterport";
import type { AnalyticsSummary, HeatmapData, TagData } from "@/lib/matterport";

/**
 * Get analytics summary for a property's scans.
 */
export async function getAnalyticsSummary(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsSummary | null> {
  const session = await requireAuth();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
    include: {
      organization: true,
      scans: { where: { isActive: true, type: "MATTERPORT" }, take: 1 },
    },
  });

  if (!property) return null;

  await requireFeature(property.organizationId, "ANALYTICS");

  const scan = property.scans[0];
  if (!scan) return null;

  const sdk = getMatterportSDK();
  return sdk.getAnalyticsSummary(
    scan.id,
    new Date(startDate),
    new Date(endDate)
  );
}

/**
 * Get heatmap data for a property's primary scan.
 */
export async function getHeatmapData(
  propertyId: string,
  timeRange: "DAY" | "WEEK" | "MONTH" | "ALL"
): Promise<HeatmapData | null> {
  const session = await requireAuth();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
    include: {
      scans: { where: { isActive: true, type: "MATTERPORT" }, take: 1 },
    },
  });

  if (!property) return null;

  await requireFeature(property.organizationId, "ANALYTICS");

  const scan = property.scans[0];
  if (!scan) return null;

  const sdk = getMatterportSDK();
  return sdk.getHeatmap(scan.id, timeRange);
}

/**
 * Get tag engagement data for a property's primary scan.
 */
export async function getTagData(
  propertyId: string
): Promise<TagData[]> {
  const session = await requireAuth();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
    include: {
      scans: { where: { isActive: true, type: "MATTERPORT" }, take: 1 },
    },
  });

  if (!property) return [];

  await requireFeature(property.organizationId, "ANALYTICS");

  const scan = property.scans[0];
  if (!scan) return [];

  const sdk = getMatterportSDK();
  return sdk.getTags(scan.id);
}
