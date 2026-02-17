import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer } from "@/actions/customers";
import { PropertyForm } from "@/components/admin/property-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Property — Elias Immersive",
};

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);

  if (!customer) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/customers/${orgId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {customer.name}
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Add Property
        </h1>
      </div>
      <PropertyForm orgId={orgId} />
    </div>
  );
}
