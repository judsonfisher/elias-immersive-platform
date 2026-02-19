"use server";

import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { exportRequestSchema } from "@/lib/validations";
import { ExportType, FeatureKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateInventoryCSV } from "@/lib/exports/inventory-csv";
import { generateInventoryPDF } from "@/lib/exports/inventory-pdf";
import { generateAnalyticsPDF } from "@/lib/exports/analytics-pdf";

const EXPORT_FEATURE_MAP: Record<ExportType, FeatureKey> = {
  INVENTORY_PDF: "INVENTORY",
  INVENTORY_CSV: "INVENTORY",
  ANALYTICS_PDF: "ANALYTICS",
  ANALYTICS_CSV: "ANALYTICS",
};

/**
 * Create and process an export job.
 */
export async function createExport(data: { type: string; propertyId: string }) {
  const session = await requireAuth();

  const validated = exportRequestSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const { type, propertyId } = validated.data;
  const exportType = type as ExportType;

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
    select: { id: true, name: true, organizationId: true },
  });

  if (!property) {
    return { success: false, error: "Property not found" };
  }

  const requiredFeature = EXPORT_FEATURE_MAP[exportType];
  await requireFeature(property.organizationId, requiredFeature);

  // Create the export job
  const job = await prisma.exportJob.create({
    data: {
      type: exportType,
      status: "PROCESSING",
      requestedBy: session.user.id,
      organizationId: property.organizationId,
      propertyId: property.id,
    },
  });

  // Process the export (mock generation for now)
  try {
    let fileUrl: string;

    switch (exportType) {
      case "INVENTORY_CSV":
        fileUrl = await generateInventoryCSV(propertyId, property.name);
        break;
      case "INVENTORY_PDF":
        fileUrl = await generateInventoryPDF(propertyId, property.name);
        break;
      case "ANALYTICS_PDF":
        fileUrl = await generateAnalyticsPDF(propertyId, property.name);
        break;
      case "ANALYTICS_CSV":
        // Use same CSV generator with analytics flag
        fileUrl = await generateInventoryCSV(propertyId, property.name);
        break;
      default:
        throw new Error(`Unsupported export type: ${exportType}`);
    }

    await prisma.exportJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        fileUrl,
        completedAt: new Date(),
      },
    });

    revalidatePath(`/properties/${propertyId}/exports`);
    return { success: true, jobId: job.id, fileUrl };
  } catch (error) {
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "FAILED" },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Get export history for a property.
 */
export async function getExportHistory(propertyId: string) {
  const session = await requireAuth();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
  });

  if (!property) return [];

  return prisma.exportJob.findMany({
    where: { propertyId },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });
}
