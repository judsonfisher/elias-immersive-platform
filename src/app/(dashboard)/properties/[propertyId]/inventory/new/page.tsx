import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { AssetForm } from "@/components/inventory/asset-form";
import { ArrowLeft } from "lucide-react";

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
    title: `New Asset — ${property?.name || "Property"} — Elias Immersive`,
  };
}

export default async function NewAssetPage({
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/properties/${propertyId}/inventory`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inventory
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Add New Asset
        </h1>
      </div>

      <AssetForm propertyId={propertyId} />
    </div>
  );
}
