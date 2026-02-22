import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getOrgFeatures } from "@/lib/features";
import { EnhancedScanViewer } from "@/components/dashboard/enhanced-scan-viewer";
import { ScanViewerWithAnnotations } from "@/components/dashboard/scan-viewer-with-annotations";
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

  // Check if annotations feature is enabled
  const features = await getOrgFeatures(property.organizationId);
  const hasAnnotations = features.includes("ANNOTATIONS");

  // Fetch annotations for all scans if feature is enabled
  let annotations: {
    id: string;
    content: string;
    type: "NOTE" | "ISSUE" | "COMMENT";
    status: "OPEN" | "RESOLVED";
    color: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    createdAt: Date;
    author: { firstName: string; lastName: string };
    scanId: string;
  }[] = [];

  if (hasAnnotations) {
    annotations = await prisma.annotation.findMany({
      where: {
        isActive: true,
        scan: {
          propertyId,
          isActive: true,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
    });
  }

  return (
    <>
      {/* Scan Viewer */}
      {property.scans.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {hasAnnotations ? (
            <ScanViewerWithAnnotations
              scans={property.scans}
              propertyName={property.name}
              isMock={isMockMode()}
              annotations={annotations}
              showAnnotations
            />
          ) : (
            <EnhancedScanViewer
              scans={property.scans}
              propertyName={property.name}
              isMock={isMockMode()}
            />
          )}
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
