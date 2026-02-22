import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getShareLinks } from "@/actions/share-links";
import { ShareLinkDialog } from "@/components/share/share-link-dialog";
import { ShareLinkList } from "@/components/share/share-link-list";

export default async function ShareLinksPage({
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

  await requireFeature(property.organizationId, "SHARE_LINKS");

  const links = await getShareLinks(propertyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Share Links</h2>
          <p className="text-sm text-muted-foreground">
            Create links to share this property with people outside your
            organization.
          </p>
        </div>
        <ShareLinkDialog propertyId={propertyId} />
      </div>

      <ShareLinkList links={links} />
    </div>
  );
}
