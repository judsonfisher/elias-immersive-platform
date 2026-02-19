import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/matterport";
import { getPropertyAssets, getInventorySummary } from "@/actions/inventory";
import { AssetList } from "@/components/inventory/asset-list";
import { InventoryStats } from "@/components/inventory/inventory-stats";
import { RoomSummary } from "@/components/inventory/room-summary";
import { CategoryBreakdown } from "@/components/inventory/category-breakdown";
import { SampleDataBadge } from "@/components/dashboard/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true },
  });
  return {
    title: `Inventory — ${property?.name || "Property"} — Elias Immersive`,
  };
}

export default async function PropertyInventoryPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const session = await requireAuth();

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

  if (!property) notFound();

  await requireFeature(property.organizationId, "INVENTORY");

  const [assets, summary] = await Promise.all([
    getPropertyAssets(propertyId),
    getInventorySummary(propertyId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            Asset Inventory
          </h2>
          <SampleDataBadge show={isMockMode()} />
        </div>
        <Button size="sm" asChild>
          <Link href={`/properties/${propertyId}/inventory/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {summary && (
        <InventoryStats
          totalItems={summary.totalItems}
          totalValue={summary.totalValue}
          roomCount={summary.rooms.length}
          categoryCount={summary.categories.length}
        />
      )}

      {/* Breakdowns */}
      {summary && summary.totalItems > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RoomSummary rooms={summary.rooms} />
          <CategoryBreakdown categories={summary.categories} />
        </div>
      )}

      {/* Asset Table */}
      <AssetList assets={assets} propertyId={propertyId} />
    </div>
  );
}
