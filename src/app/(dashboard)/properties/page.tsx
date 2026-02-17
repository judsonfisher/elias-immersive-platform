import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PropertyGrid } from "@/components/dashboard/property-grid";

export const metadata = {
  title: "Properties — Elias Immersive",
};

export default async function PropertiesPage() {
  const session = await requireAuth();

  // Admins don't have an org — redirect to admin panel
  if (session.user.role === "ADMIN") {
    redirect("/admin/customers");
  }

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/login");

  const properties = await prisma.property.findMany({
    where: { organizationId: orgId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { scans: { where: { isActive: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-1">
          Properties
        </h1>
        <p className="text-muted-foreground">
          Select a property to view its scans.
        </p>
      </div>
      <PropertyGrid properties={properties} />
    </div>
  );
}
