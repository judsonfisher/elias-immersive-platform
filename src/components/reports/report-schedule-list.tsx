"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Pause,
  Play,
  Trash2,
  Mail,
} from "lucide-react";
import {
  pauseReportSchedule,
  resumeReportSchedule,
  deleteReportSchedule,
} from "@/actions/report-schedules";
import { toast } from "sonner";

interface ReportScheduleData {
  id: string;
  frequency: "WEEKLY" | "MONTHLY";
  recipients: string[];
  lastSentAt: Date | null;
  nextSendAt: Date;
  isActive: boolean;
  createdAt: Date;
  property: { name: string } | null;
}

interface ReportScheduleListProps {
  schedules: ReportScheduleData[];
}

export function ReportScheduleList({ schedules }: ReportScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-sm font-medium">No report schedules</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a schedule to automatically send analytics reports to your team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <ReportScheduleRow key={schedule.id} schedule={schedule} />
      ))}
    </div>
  );
}

function ReportScheduleRow({
  schedule,
}: {
  schedule: ReportScheduleData;
}) {
  const [isPending, startTransition] = useTransition();

  function handlePause() {
    startTransition(async () => {
      try {
        await pauseReportSchedule(schedule.id);
        toast.success("Schedule paused");
      } catch {
        toast.error("Failed to pause schedule");
      }
    });
  }

  function handleResume() {
    startTransition(async () => {
      try {
        await resumeReportSchedule(schedule.id);
        toast.success("Schedule resumed");
      } catch {
        toast.error("Failed to resume schedule");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteReportSchedule(schedule.id);
        toast.success("Schedule deleted");
      } catch {
        toast.error("Failed to delete schedule");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={schedule.isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {schedule.frequency === "WEEKLY" ? "Weekly" : "Monthly"}
          </Badge>
          {!schedule.isActive && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Paused
            </Badge>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {schedule.isActive ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePause}
              disabled={isPending}
              title="Pause schedule"
              className="h-8 w-8"
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResume}
              disabled={isPending}
              title="Resume schedule"
              className="h-8 w-8 text-green-600 hover:text-green-600"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete schedule"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Recipients */}
      <div className="flex items-start gap-2">
        <Mail className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap gap-1">
          {schedule.recipients.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {email}
            </Badge>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {schedule.lastSentAt && (
          <>
            <span>
              Last sent: {new Date(schedule.lastSentAt).toLocaleDateString()}
            </span>
            <span>·</span>
          </>
        )}
        <span>
          Next:{" "}
          {schedule.isActive
            ? new Date(schedule.nextSendAt).toLocaleDateString()
            : "Paused"}
        </span>
        <span>·</span>
        <span>
          Created {new Date(schedule.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
