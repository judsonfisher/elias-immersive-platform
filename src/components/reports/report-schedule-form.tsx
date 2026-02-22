"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createReportSchedule } from "@/actions/report-schedules";
import { toast } from "sonner";

interface ReportScheduleFormProps {
  propertyId: string;
}

export function ReportScheduleForm({ propertyId }: ReportScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  function addRecipient() {
    const email = emailInput.trim().toLowerCase();
    if (!email || recipients.includes(email)) return;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address");
      return;
    }
    if (recipients.length >= 10) {
      toast.error("Maximum 10 recipients");
      return;
    }
    setRecipients([...recipients, email]);
    setEmailInput("");
  }

  function removeRecipient(email: string) {
    setRecipients(recipients.filter((r) => r !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addRecipient();
    }
  }

  function handleCreate(formData: FormData) {
    formData.set("propertyId", propertyId);
    formData.set("recipients", recipients.join(","));
    startTransition(async () => {
      try {
        await createReportSchedule(formData);
        toast.success("Report schedule created");
        setOpen(false);
        setRecipients([]);
        setEmailInput("");
      } catch {
        toast.error("Failed to create schedule");
      }
    });
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setRecipients([]);
      setEmailInput("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Report Schedule</DialogTitle>
        </DialogHeader>

        <form action={handleCreate} className="space-y-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select name="frequency" defaultValue="WEEKLY">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly (every Monday)</SelectItem>
                <SelectItem value="MONTHLY">Monthly (1st of month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipient}
                disabled={!emailInput.trim()}
              >
                Add
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {recipients.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {recipients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add at least one recipient email address.
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || recipients.length === 0}
          >
            {isPending ? "Creating..." : "Create Schedule"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
