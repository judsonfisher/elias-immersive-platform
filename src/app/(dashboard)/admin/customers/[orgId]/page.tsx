import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer } from "@/actions/customers";
import { SendInviteButton, InviteList } from "@/components/admin/invite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Pencil,
  Plus,
  ArrowLeft,
  User,
  ScanLine,
  Sparkles,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);
  return { title: `${customer?.name || "Customer"} — Elias Immersive` };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/customers"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Customers
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
            {customer.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customers/${orgId}/features`}>
              <Sparkles className="mr-2 h-4 w-4" />
              Features
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customers/${orgId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">
                {customer.contactName || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">
                {customer.contactEmail || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">
                {customer.contactPhone || "—"}
              </p>
            </div>
          </div>
          {customer.notes && (
            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
            Properties ({customer.properties.length})
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/admin/customers/${orgId}/properties/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customer.properties.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No properties yet. Add the first one.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/admin/customers/${orgId}/properties/${property.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/60">
                        ID: {property.id}
                      </p>
                      {(property.address || property.city) && (
                        <p className="text-sm text-muted-foreground">
                          {[property.address, property.city, property.state]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {property._count.scans} scan{property._count.scans !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
            Team Members ({customer.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.users.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <User className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No team members yet. Send an invite below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customer.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.lastLoginAt
                      ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString()}`
                      : "Never logged in"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
            Invites
          </CardTitle>
          <SendInviteButton orgId={orgId} />
        </CardHeader>
        <CardContent>
          <InviteList invites={customer.invites} orgId={orgId} />
          {customer.invites.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No invites sent yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
