import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getOrgFeatures } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin } from "lucide-react";
import { PropertyTabs } from "@/components/dashboard/property-tabs";

export default async function PropertyLayout({
  params,
  children,
}: {
  params: Promise<{ propertyId: string }>;
  children: React.ReactNode;
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
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      description: true,
      organizationId: true,
    },
  });

  if (!property) notFound();

  const enabledFeatures = await getOrgFeatures(property.organizationId);

  const address = [property.address, property.city, property.state, property.zipCode]
    .filter(Boolean)
    .join(", ");

  // Check if customer has multiple properties (for back navigation)
  const propertyCount =
    session.user.role !== "ADMIN"
      ? await prisma.property.count({
          where: {
            organizationId: property.organizationId,
            isActive: true,
          },
        })
      : 2; // Admin always sees back link

  const backHref =
    session.user.role === "ADMIN"
      ? `/admin/customers/${property.organizationId}`
      : "/dashboard";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        {propertyCount > 1 && (
          <Link
            href={backHref}
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
        <p className="mt-1 text-xs text-muted-foreground">
          ID: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{property.id}</code>
        </p>
      </div>

      {/* Tab navigation */}
      <PropertyTabs
        propertyId={propertyId}
        enabledFeatures={enabledFeatures}
      />

      {/* Page content */}
      {children}
    </div>
  );
}
