"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { createReportScheduleSchema } from "@/lib/validations";
import type { ReportFrequency } from "@prisma/client";

/**
 * Compute the next send date based on frequency.
 * WEEKLY → next Monday 8:00 AM UTC
 * MONTHLY → first of next month 8:00 AM UTC
 */
function computeNextSendAt(frequency: ReportFrequency): Date {
  const now = new Date();

  if (frequency === "WEEKLY") {
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + daysUntilMonday);
    next.setUTCHours(8, 0, 0, 0);
    return next;
  }

  // MONTHLY → first of next month
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 8, 0, 0, 0));
  return next;
}

export async function createReportSchedule(formData: FormData) {
  const session = await requireAuth();

  const rawData = {
    propertyId: (formData.get("propertyId") as string) || undefined,
    frequency: formData.get("frequency") as string,
    recipients: (formData.get("recipients") as string)
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  };

  const data = createReportScheduleSchema.parse(rawData);

  // If propertyId is set, verify access
  let organizationId: string;

  if (data.propertyId) {
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        isActive: true,
        ...(session.user.role !== "ADMIN"
          ? { organizationId: session.user.organizationId! }
          : {}),
      },
      select: { organizationId: true },
    });

    if (!property) throw new Error("Property not found");
    organizationId = property.organizationId;
  } else {
    if (!session.user.organizationId) throw new Error("No organization");
    organizationId = session.user.organizationId;
  }

  await requireFeature(organizationId, "ANALYTICS");
  await requireFeature(organizationId, "SCHEDULED_REPORTS");

  const frequency = data.frequency as ReportFrequency;
  const nextSendAt = computeNextSendAt(frequency);

  const schedule = await prisma.reportSchedule.create({
    data: {
      frequency,
      recipients: data.recipients,
      nextSendAt,
      organizationId,
      propertyId: data.propertyId || null,
    },
  });

  if (data.propertyId) {
    revalidatePath(`/properties/${data.propertyId}/reports`);
  }

  return schedule;
}

export async function updateReportSchedule(
  id: string,
  updates: {
    frequency?: ReportFrequency;
    recipients?: string[];
  }
) {
  const session = await requireAuth();

  const schedule = await prisma.reportSchedule.findUnique({
    where: { id },
    include: { organization: { select: { id: true } } },
  });

  if (!schedule) throw new Error("Schedule not found");

  if (
    session.user.role !== "ADMIN" &&
    schedule.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = {};

  if (updates.frequency) {
    updateData.frequency = updates.frequency;
    updateData.nextSendAt = computeNextSendAt(updates.frequency);
  }

  if (updates.recipients) {
    updateData.recipients = updates.recipients;
  }

  await prisma.reportSchedule.update({
    where: { id },
    data: updateData,
  });

  if (schedule.propertyId) {
    revalidatePath(`/properties/${schedule.propertyId}/reports`);
  }
}

export async function deleteReportSchedule(id: string) {
  const session = await requireAuth();

  const schedule = await prisma.reportSchedule.findUnique({
    where: { id },
  });

  if (!schedule) throw new Error("Schedule not found");

  if (
    session.user.role !== "ADMIN" &&
    schedule.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.reportSchedule.delete({
    where: { id },
  });

  if (schedule.propertyId) {
    revalidatePath(`/properties/${schedule.propertyId}/reports`);
  }
}

export async function pauseReportSchedule(id: string) {
  const session = await requireAuth();

  const schedule = await prisma.reportSchedule.findUnique({
    where: { id },
  });

  if (!schedule) throw new Error("Schedule not found");

  if (
    session.user.role !== "ADMIN" &&
    schedule.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.reportSchedule.update({
    where: { id },
    data: { isActive: false },
  });

  if (schedule.propertyId) {
    revalidatePath(`/properties/${schedule.propertyId}/reports`);
  }
}

export async function resumeReportSchedule(id: string) {
  const session = await requireAuth();

  const schedule = await prisma.reportSchedule.findUnique({
    where: { id },
  });

  if (!schedule) throw new Error("Schedule not found");

  if (
    session.user.role !== "ADMIN" &&
    schedule.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.reportSchedule.update({
    where: { id },
    data: {
      isActive: true,
      nextSendAt: computeNextSendAt(schedule.frequency),
    },
  });

  if (schedule.propertyId) {
    revalidatePath(`/properties/${schedule.propertyId}/reports`);
  }
}

export async function getReportSchedules(propertyId: string) {
  const session = await requireAuth();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ...(session.user.role !== "ADMIN"
        ? { organizationId: session.user.organizationId! }
        : {}),
    },
    select: { id: true },
  });

  if (!property) throw new Error("Property not found");

  return prisma.reportSchedule.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { name: true } },
    },
  });
}
