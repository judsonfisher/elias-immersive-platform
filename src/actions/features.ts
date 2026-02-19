"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { FeatureKey } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Enable a feature for an organization.
 */
export async function enableFeature(
  organizationId: string,
  featureKey: FeatureKey
) {
  const session = await requireAdmin();

  await prisma.organizationFeature.upsert({
    where: {
      organizationId_featureKey: {
        organizationId,
        featureKey,
      },
    },
    update: {},
    create: {
      organizationId,
      featureKey,
      enabledBy: session.user.id,
    },
  });

  revalidatePath(`/admin/customers/${organizationId}`);
  revalidatePath(`/admin/customers/${organizationId}/features`);
  return { success: true };
}

/**
 * Disable a feature for an organization.
 */
export async function disableFeature(
  organizationId: string,
  featureKey: FeatureKey
) {
  await requireAdmin();

  await prisma.organizationFeature.deleteMany({
    where: {
      organizationId,
      featureKey,
    },
  });

  revalidatePath(`/admin/customers/${organizationId}`);
  revalidatePath(`/admin/customers/${organizationId}/features`);
  return { success: true };
}

/**
 * Get all feature statuses for an organization (for admin UI).
 */
export async function getFeatureStatus(organizationId: string) {
  await requireAdmin();

  const enabled = await prisma.organizationFeature.findMany({
    where: { organizationId },
    select: { featureKey: true, enabledAt: true, enabledBy: true },
  });

  const enabledMap = new Map(enabled.map((f) => [f.featureKey, f]));
  const allKeys = Object.values(FeatureKey);

  return allKeys.map((key) => ({
    key,
    enabled: enabledMap.has(key),
    enabledAt: enabledMap.get(key)?.enabledAt ?? null,
    enabledBy: enabledMap.get(key)?.enabledBy ?? null,
  }));
}
