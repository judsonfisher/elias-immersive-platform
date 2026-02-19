import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer } from "@/actions/customers";
import { getFeatureStatus } from "@/actions/features";
import { FeatureToggleCard } from "@/components/admin/feature-toggle-card";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);
  return {
    title: `Features — ${customer?.name || "Customer"} — Elias Immersive`,
  };
}

export default async function CustomerFeaturesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);

  if (!customer) notFound();

  const features = await getFeatureStatus(orgId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/customers/${orgId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {customer.name}
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Premium Features
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enable or disable premium features for this customer. Features will
          appear in the customer&apos;s sidebar when enabled.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        {features.map((feature) => (
          <FeatureToggleCard
            key={feature.key}
            organizationId={orgId}
            featureKey={feature.key}
            enabled={feature.enabled}
            enabledAt={feature.enabledAt}
          />
        ))}
      </div>
    </div>
  );
}
