import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getReportSchedules } from "@/actions/report-schedules";
import { ReportScheduleForm } from "@/components/reports/report-schedule-form";
import { ReportScheduleList } from "@/components/reports/report-schedule-list";

export default async function ReportsPage({
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

  // Reports requires both ANALYTICS and SCHEDULED_REPORTS
  await requireFeature(property.organizationId, "ANALYTICS");
  await requireFeature(property.organizationId, "SCHEDULED_REPORTS");

  const schedules = await getReportSchedules(propertyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Reports</h2>
          <p className="text-sm text-muted-foreground">
            Automatically send analytics report digests to your team on a
            weekly or monthly schedule.
          </p>
        </div>
        <ReportScheduleForm propertyId={propertyId} />
      </div>

      <ReportScheduleList schedules={schedules} />
    </div>
  );
}
