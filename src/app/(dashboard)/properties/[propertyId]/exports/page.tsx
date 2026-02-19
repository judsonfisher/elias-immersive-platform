import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { getOrgFeatures } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { getExportHistory } from "@/actions/exports";
import { ExportButton } from "@/components/exports/export-button";
import { ExportHistory } from "@/components/exports/export-history";

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
    title: `Exports — ${property?.name || "Property"} — Elias Immersive`,
  };
}

export default async function PropertyExportsPage({
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

  const [enabledFeatures, history] = await Promise.all([
    getOrgFeatures(property.organizationId),
    getExportHistory(propertyId),
  ]);

  // Need at least one feature to access exports
  if (
    !enabledFeatures.includes("ANALYTICS") &&
    !enabledFeatures.includes("INVENTORY")
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
            Exports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and download reports for {property.name}.
          </p>
        </div>
        <ExportButton
          propertyId={propertyId}
          enabledFeatures={enabledFeatures}
        />
      </div>

      {/* History */}
      <ExportHistory jobs={history} />
    </div>
  );
}
