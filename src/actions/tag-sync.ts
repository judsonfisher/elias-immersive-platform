"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { fetchModelData } from "@/lib/matterport/graphql-client";
import { revalidatePath } from "next/cache";

/**
 * Sync mattertags from the Matterport GraphQL API into the ScanTag table.
 * Admin-only action.
 */
export async function syncTagsForScan(scanId: string) {
  await requireAdmin();

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: {
      id: true,
      matterportSid: true,
      type: true,
      property: { select: { organizationId: true, id: true } },
    },
  });

  if (!scan || scan.type !== "MATTERPORT" || !scan.matterportSid) {
    return { success: false, error: "Invalid scan or missing Matterport SID" };
  }

  try {
    const modelData = await fetchModelData(scan.matterportSid);

    let synced = 0;
    for (const tag of modelData.mattertags) {
      await prisma.scanTag.upsert({
        where: {
          scanId_tagId: { scanId, tagId: tag.id },
        },
        create: {
          scanId,
          tagId: tag.id,
          label: tag.label || "Untitled",
          category: null,
          positionX: tag.anchorPosition.x,
          positionY: tag.anchorPosition.y,
          positionZ: tag.anchorPosition.z,
          isActive: true,
        },
        update: {
          label: tag.label || "Untitled",
          positionX: tag.anchorPosition.x,
          positionY: tag.anchorPosition.y,
          positionZ: tag.anchorPosition.z,
          isActive: true,
        },
      });
      synced++;
    }

    // Deactivate tags that no longer exist in Matterport
    const currentTagIds = modelData.mattertags.map((t) => t.id);
    if (currentTagIds.length > 0) {
      await prisma.scanTag.updateMany({
        where: {
          scanId,
          tagId: { notIn: currentTagIds },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    revalidatePath(
      `/admin/customers/${scan.property.organizationId}/properties/${scan.property.id}`
    );
    return { success: true, synced };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
