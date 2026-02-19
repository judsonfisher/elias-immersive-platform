"use server";

import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { assetItemSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

/**
 * Get all assets for a property (with org access check + feature gate).
 */
export async function getPropertyAssets(propertyId: string) {
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

  await requireFeature(property.organizationId, "INVENTORY");

  return prisma.assetItem.findMany({
    where: { propertyId, isActive: true },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ roomName: "asc" }, { name: "asc" }],
  });
}

/**
 * Get a single asset by ID.
 */
export async function getAsset(assetId: string) {
  const session = await requireAuth();

  const asset = await prisma.assetItem.findUnique({
    where: { id: assetId },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      property: { select: { id: true, name: true, organizationId: true } },
    },
  });

  if (!asset || !asset.isActive) return null;

  // Org access check
  if (
    session.user.role !== "ADMIN" &&
    asset.property.organizationId !== session.user.organizationId
  ) {
    return null;
  }

  await requireFeature(asset.property.organizationId, "INVENTORY");

  return asset;
}

/**
 * Create a new asset for a property.
 */
export async function createAsset(
  propertyId: string,
  data: Record<string, unknown>
) {
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

  if (!property) {
    return { success: false, error: "Property not found" };
  }

  await requireFeature(property.organizationId, "INVENTORY");

  const validated = assetItemSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const { purchaseDate, purchasePrice, estimatedValue, ...rest } = validated.data;

  const asset = await prisma.assetItem.create({
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: typeof purchasePrice === "number" ? purchasePrice : null,
      estimatedValue: typeof estimatedValue === "number" ? estimatedValue : null,
      propertyId,
    },
  });

  revalidatePath(`/properties/${propertyId}/inventory`);
  return { success: true, assetId: asset.id };
}

/**
 * Update an existing asset.
 */
export async function updateAsset(
  assetId: string,
  data: Record<string, unknown>
) {
  const session = await requireAuth();

  const asset = await prisma.assetItem.findUnique({
    where: { id: assetId },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!asset) {
    return { success: false, error: "Asset not found" };
  }

  if (
    session.user.role !== "ADMIN" &&
    asset.property.organizationId !== session.user.organizationId
  ) {
    return { success: false, error: "Access denied" };
  }

  await requireFeature(asset.property.organizationId, "INVENTORY");

  const validated = assetItemSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  const { purchaseDate, purchasePrice, estimatedValue, ...rest } = validated.data;

  await prisma.assetItem.update({
    where: { id: assetId },
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: typeof purchasePrice === "number" ? purchasePrice : null,
      estimatedValue: typeof estimatedValue === "number" ? estimatedValue : null,
    },
  });

  revalidatePath(`/properties/${asset.property.id}/inventory`);
  revalidatePath(`/properties/${asset.property.id}/inventory/${assetId}`);
  return { success: true };
}

/**
 * Soft-delete an asset.
 */
export async function deleteAsset(assetId: string) {
  const session = await requireAuth();

  const asset = await prisma.assetItem.findUnique({
    where: { id: assetId },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!asset) {
    return { success: false, error: "Asset not found" };
  }

  if (
    session.user.role !== "ADMIN" &&
    asset.property.organizationId !== session.user.organizationId
  ) {
    return { success: false, error: "Access denied" };
  }

  await prisma.assetItem.update({
    where: { id: assetId },
    data: { isActive: false },
  });

  revalidatePath(`/properties/${asset.property.id}/inventory`);
  return { success: true };
}

/**
 * Get inventory summary stats for a property.
 */
export async function getInventorySummary(propertyId: string) {
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

  if (!property) return null;

  await requireFeature(property.organizationId, "INVENTORY");

  const assets = await prisma.assetItem.findMany({
    where: { propertyId, isActive: true },
    select: {
      roomName: true,
      category: true,
      estimatedValue: true,
      condition: true,
    },
  });

  const totalItems = assets.length;
  const totalValue = assets.reduce(
    (sum, a) => sum + (a.estimatedValue || 0),
    0
  );

  // Room breakdown
  const roomMap = new Map<string, number>();
  assets.forEach((a) => {
    roomMap.set(a.roomName, (roomMap.get(a.roomName) || 0) + 1);
  });
  const rooms = Array.from(roomMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Category breakdown
  const categoryMap = new Map<string, { count: number; value: number }>();
  assets.forEach((a) => {
    const existing = categoryMap.get(a.category) || { count: 0, value: 0 };
    existing.count++;
    existing.value += a.estimatedValue || 0;
    categoryMap.set(a.category, existing);
  });
  const categories = Array.from(categoryMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value);

  // Condition breakdown
  const conditionMap = new Map<string, number>();
  assets.forEach((a) => {
    conditionMap.set(a.condition, (conditionMap.get(a.condition) || 0) + 1);
  });
  const conditions = Array.from(conditionMap.entries())
    .map(([condition, count]) => ({ condition, count }))
    .sort((a, b) => b.count - a.count);

  return { totalItems, totalValue, rooms, categories, conditions };
}
