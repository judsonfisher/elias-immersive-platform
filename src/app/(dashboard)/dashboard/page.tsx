import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ScanLine, UserPlus } from "lucide-react";
import Link from "next/link";
import { PropertyGrid } from "@/components/dashboard/property-grid";

export const metadata = {
  title: "Dashboard — Elias Immersive",
};

async function getAdminStats() {
  const [customers, properties, scans, pendingInvites, recentCustomers] =
    await Promise.all([
      prisma.organization.count({ where: { isActive: true } }),
      prisma.property.count({ where: { isActive: true } }),
      prisma.scan.count({ where: { isActive: true } }),
      prisma.invite.count({ where: { status: "PENDING" } }),
      prisma.organization.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: { select: { properties: true, users: true } },
        },
      }),
    ]);

  return { customers, properties, scans, pendingInvites, recentCustomers };
}

async function getCustomerProperties(organizationId: string) {
  return prisma.property.findMany({
    where: { organizationId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { scans: { where: { isActive: true } } } },
    },
  });
}

export default async function DashboardPage() {
  const session = await requireAuth();

  if (session.user.role === "ADMIN") {
    const stats = await getAdminStats();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-1">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your platform activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.properties}</div>
              <p className="text-xs text-muted-foreground">
                Total properties tracked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scans</CardTitle>
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scans}</div>
              <p className="text-xs text-muted-foreground">
                Matterport + Nira scans
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Invites
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvites}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting acceptance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
              Recent Customers
            </CardTitle>
            <Link
              href="/admin/customers"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No customers yet.{" "}
                <Link
                  href="/admin/customers/new"
                  className="text-primary hover:underline"
                >
                  Create your first customer
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {customer.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer._count.properties} properties ·{" "}
                          {customer._count.users} users
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Customer Dashboard ─────────────────────────────────────────────
  const orgId = session.user.organizationId;
  if (!orgId) redirect("/login");

  const properties = await getCustomerProperties(orgId);

  // Single property → auto-redirect to scan viewer
  if (properties.length === 1) {
    redirect(`/properties/${properties[0].id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-1">
          Your Properties
        </h1>
        <p className="text-muted-foreground">
          Select a property to view its digital twin scans.
        </p>
      </div>
      <PropertyGrid properties={properties} />
    </div>
  );
}
