"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { scanSchema } from "@/lib/validations";
import { extractMatterportSid } from "@/lib/matterport/utils";

export async function createScan(propertyId: string, formData: FormData) {
  await requireAdmin();

  const data = scanSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    embedUrl: formData.get("embedUrl"),
    description: formData.get("description"),
  });

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { organizationId: true },
  });

  if (!property) {
    return { success: false, error: "Property not found" };
  }

  const matterportSid =
    data.type === "MATTERPORT" ? extractMatterportSid(data.embedUrl) : null;

  await prisma.scan.create({
    data: {
      ...data,
      propertyId,
      matterportSid,
      description: data.description || null,
    },
  });

  revalidatePath(`/admin/customers/${property.organizationId}`);
  return { success: true };
}

export async function updateScan(scanId: string, formData: FormData) {
  await requireAdmin();

  const data = scanSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    embedUrl: formData.get("embedUrl"),
    description: formData.get("description"),
  });

  const matterportSid =
    data.type === "MATTERPORT" ? extractMatterportSid(data.embedUrl) : null;

  const scan = await prisma.scan.update({
    where: { id: scanId },
    data: {
      ...data,
      matterportSid,
      description: data.description || null,
    },
    include: { property: { select: { organizationId: true } } },
  });

  revalidatePath(`/admin/customers/${scan.property.organizationId}`);
  return { success: true };
}

export async function deleteScan(scanId: string) {
  await requireAdmin();

  const scan = await prisma.scan.update({
    where: { id: scanId },
    data: { isActive: false },
    include: { property: { select: { organizationId: true } } },
  });

  revalidatePath(`/admin/customers/${scan.property.organizationId}`);
  return { success: true };
}
