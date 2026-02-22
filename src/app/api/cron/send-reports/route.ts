import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatterportSDK } from "@/lib/matterport";
import { generateReportEmailHtml } from "@/lib/exports/report-email";
import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";
import type { ReportFrequency } from "@prisma/client";

const from = process.env.EMAIL_FROM || `${APP_NAME} <noreply@eliasimmersive.com>`;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Compute the next send date based on frequency.
 */
function computeNextSendAt(frequency: ReportFrequency): Date {
  const now = new Date();

  if (frequency === "WEEKLY") {
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + daysUntilMonday);
    next.setUTCHours(8, 0, 0, 0);
    return next;
  }

  // MONTHLY
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 8, 0, 0, 0)
  );
}

/**
 * Get the reporting period date range based on frequency.
 */
function getReportPeriod(frequency: ReportFrequency): {
  startDate: Date;
  endDate: Date;
  label: string;
} {
  const now = new Date();

  if (frequency === "WEEKLY") {
    const startDate = new Date(now);
    startDate.setUTCDate(now.getUTCDate() - 7);
    startDate.setUTCHours(0, 0, 0, 0);
    return {
      startDate,
      endDate: now,
      label: `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    };
  }

  // MONTHLY
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0)
  );
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)
  );
  return {
    startDate,
    endDate,
    label: `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  };
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all due schedules
    const dueSchedules = await prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextSendAt: { lte: new Date() },
      },
      include: {
        organization: { select: { name: true } },
        property: {
          select: {
            id: true,
            name: true,
            scans: {
              where: { isActive: true, type: "MATTERPORT" },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    const resend = getResend();
    const sdk = getMatterportSDK();
    let sent = 0;
    let failed = 0;

    for (const schedule of dueSchedules) {
      try {
        if (!schedule.property || schedule.property.scans.length === 0) {
          // No property or no scans — skip
          await prisma.reportSchedule.update({
            where: { id: schedule.id },
            data: { nextSendAt: computeNextSendAt(schedule.frequency) },
          });
          continue;
        }

        const scanId = schedule.property.scans[0].id;
        const period = getReportPeriod(schedule.frequency);

        // Get analytics summary
        const summary = await sdk.getAnalyticsSummary(
          scanId,
          period.startDate,
          period.endDate
        );

        // Generate email HTML
        const html = generateReportEmailHtml({
          organizationName: schedule.organization.name,
          propertyName: schedule.property.name,
          propertyId: schedule.property.id,
          summary,
          frequency: schedule.frequency,
          periodLabel: period.label,
        });

        const subject = `${schedule.frequency === "WEEKLY" ? "Weekly" : "Monthly"} Report: ${schedule.property.name} — ${APP_NAME}`;

        // Send to all recipients
        for (const recipient of schedule.recipients) {
          await resend.emails.send({
            from,
            to: recipient,
            subject,
            html,
          });
        }

        // Update schedule
        await prisma.reportSchedule.update({
          where: { id: schedule.id },
          data: {
            lastSentAt: new Date(),
            nextSendAt: computeNextSendAt(schedule.frequency),
          },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send report for schedule ${schedule.id}:`, err);
        failed++;

        // Still advance the schedule to avoid sending stale reports forever
        await prisma.reportSchedule.update({
          where: { id: schedule.id },
          data: { nextSendAt: computeNextSendAt(schedule.frequency) },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: dueSchedules.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error("Cron send-reports error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
