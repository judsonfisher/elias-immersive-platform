import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/matterport";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true },
  });
  return {
    title: `Analytics — ${property?.name || "Property"} — Elias Immersive`,
  };
}

export default async function PropertyAnalyticsPage({
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
    select: { id: true, name: true, organizationId: true },
  });

  if (!property) notFound();

  await requireFeature(property.organizationId, "ANALYTICS");

  return (
    <AnalyticsDashboard
      propertyId={property.id}
      propertyName={property.name}
      isMock={isMockMode()}
    />
  );
}
