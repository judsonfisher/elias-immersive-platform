import { notFound } from "next/navigation";
import Link from "next/link";
import { getProperty } from "@/actions/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanList } from "@/components/admin/scan-list";
import {
  ArrowLeft,
  Pencil,
  Plus,
  MapPin,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string; propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);
  return { title: `${property?.name || "Property"} — Elias Immersive` };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; propertyId: string }>;
}) {
  const { orgId, propertyId } = await params;
  const property = await getProperty(propertyId);

  if (!property) notFound();

  const address = [property.address, property.city, property.state, property.zipCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/admin/customers/${orgId}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {property.organization.name}
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
            {property.name}
          </h1>
          {address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {address}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            ID: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{propertyId}</code>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/customers/${orgId}/properties/${propertyId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Property Info */}
      {property.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{property.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
            Scans ({property.scans.length})
          </CardTitle>
          <Button size="sm" asChild>
            <Link
              href={`/admin/customers/${orgId}/properties/${propertyId}/scans/new`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Scan
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ScanList scans={property.scans} orgId={orgId} propertyId={propertyId} />
        </CardContent>
      </Card>
    </div>
  );
}
