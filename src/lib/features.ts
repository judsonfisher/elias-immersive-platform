import { prisma } from "@/lib/prisma";
import { FeatureKey } from "@prisma/client";

export { FeatureKey };

/**
 * Check whether an organization has a specific feature enabled.
 */
export async function hasFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<boolean> {
  const record = await prisma.organizationFeature.findUnique({
    where: {
      organizationId_featureKey: {
        organizationId,
        featureKey: feature,
      },
    },
  });
  return !!record;
}

/**
 * Guard that throws a redirect if the organization doesn't have the feature.
 * Use in server components / actions.
 */
export async function requireFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<void> {
  const enabled = await hasFeature(organizationId, feature);
  if (!enabled) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
}

/**
 * Get all enabled features for an organization.
 */
export async function getOrgFeatures(
  organizationId: string
): Promise<FeatureKey[]> {
  const features = await prisma.organizationFeature.findMany({
    where: { organizationId },
    select: { featureKey: true },
  });
  return features.map((f) => f.featureKey);
}

/**
 * Feature metadata for display in admin UI.
 */
export const FEATURE_METADATA: Record<
  FeatureKey,
  { label: string; description: string; icon: string }
> = {
  ANALYTICS: {
    label: "Scan Analytics",
    description:
      "Heatmaps, session tracking, tag engagement metrics, and dwell time analysis for Matterport scans.",
    icon: "BarChart3",
  },
  INVENTORY: {
    label: "Asset Inventory",
    description:
      "Room-by-room asset cataloging with photos, conditions, values, and export to PDF/CSV for insurance documentation.",
    icon: "Package",
  },
};
