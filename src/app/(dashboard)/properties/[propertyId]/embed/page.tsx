import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getEmbedConfigs } from "@/actions/embed-configs";
import { EmbedConfigDialog } from "@/components/embed/embed-config-dialog";
import { EmbedConfigList } from "@/components/embed/embed-config-list";

export default async function EmbedPage({
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
    select: { organizationId: true },
  });

  if (!property) notFound();

  await requireFeature(property.organizationId, "EMBED_WIDGET");

  const configs = await getEmbedConfigs(propertyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Embed Widget</h2>
          <p className="text-sm text-muted-foreground">
            Generate embeddable iframe snippets to display this property on
            external websites. Analytics are captured automatically.
          </p>
        </div>
        <EmbedConfigDialog propertyId={propertyId} />
      </div>

      <EmbedConfigList configs={configs} />
    </div>
  );
}
