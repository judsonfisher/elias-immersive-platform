import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { EnhancedScanViewer } from "@/components/dashboard/enhanced-scan-viewer";
import { isMockMode } from "@/lib/matterport";
import { ScanLine } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await prisma.property.findUnique({
    where: { id: propertyId, isActive: true },
    select: { name: true },
  });
  return { title: `${property?.name || "Property"} — Elias Immersive` };
}

export default async function CustomerPropertyPage({
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
    include: {
      scans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!property) notFound();

  return (
    <>
      {/* Scan Viewer */}
      {property.scans.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <EnhancedScanViewer
            scans={property.scans}
            propertyName={property.name}
            isMock={isMockMode()}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <ScanLine className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium">No scans available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Scans for this property haven&apos;t been added yet. Check back soon.
          </p>
        </div>
      )}

      {/* Property description */}
      {property.description && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{property.description}</p>
        </div>
      )}
    </>
  );
}
