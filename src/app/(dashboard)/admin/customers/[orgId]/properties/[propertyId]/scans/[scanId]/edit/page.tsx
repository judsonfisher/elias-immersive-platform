import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { ScanForm } from "@/components/admin/scan-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Edit Scan — Elias Immersive",
};

export default async function EditScanPage({
  params,
}: {
  params: Promise<{ orgId: string; propertyId: string; scanId: string }>;
}) {
  await requireAdmin();
  const { orgId, propertyId, scanId } = await params;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId, isActive: true },
    include: { property: { select: { name: true } } },
  });

  if (!scan) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/customers/${orgId}/properties/${propertyId}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {scan.property.name}
        </Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Edit Scan
        </h1>
      </div>
      <ScanForm propertyId={propertyId} orgId={orgId} scan={scan} />
    </div>
  );
}
