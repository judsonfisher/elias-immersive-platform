import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ScanViewer } from "@/components/dashboard/scan-viewer";
import { ArrowLeft, MapPin, ScanLine } from "lucide-react";

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
  const session = await requireAuth();
  const { propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId, isActive: true },
    include: {
      scans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { id: true } },
    },
  });

  if (!property) notFound();

  // Security: customers can only view their own org's properties
  if (session.user.role !== "ADMIN") {
    if (session.user.organizationId !== property.organization.id) {
      redirect("/dashboard");
    }
  }

  const address = [property.address, property.city, property.state, property.zipCode]
    .filter(Boolean)
    .join(", ");

  // Check if customer has multiple properties (for back navigation)
  const propertyCount =
    session.user.role !== "ADMIN"
      ? await prisma.property.count({
          where: {
            organizationId: property.organization.id,
            isActive: true,
          },
        })
      : 2; // Admin always sees back link

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        {propertyCount > 1 && (
          <Link
            href={session.user.role === "ADMIN" ? `/admin/customers/${property.organization.id}` : "/dashboard"}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {session.user.role === "ADMIN" ? "Back" : "All Properties"}
          </Link>
        )}
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
          {property.name}
        </h1>
        {address && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {address}
          </p>
        )}
      </div>

      {/* Scan Viewer */}
      {property.scans.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <ScanViewer scans={property.scans} propertyName={property.name} />
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
    </div>
  );
}
