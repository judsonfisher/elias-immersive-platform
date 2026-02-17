import { notFound } from "next/navigation";
import Link from "next/link";
import { getProperty } from "@/actions/properties";
import { PropertyForm } from "@/components/admin/property-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Edit Property — Elias Immersive",
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ orgId: string; propertyId: string }>;
}) {
  const { orgId, propertyId } = await params;
  const property = await getProperty(propertyId);

  if (!property) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/customers/${orgId}/properties/${propertyId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {property.name}
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Edit Property
        </h1>
      </div>
      <PropertyForm orgId={orgId} property={property} />
    </div>
  );
}
