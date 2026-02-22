"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tag,
  Ruler,
  Eye,
  RotateCcw,
  Move3D,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShowcaseEventCapture } from "@/lib/matterport/showcase-client";

interface SDKControlsProps {
  isMock: boolean;
  capture: ShowcaseEventCapture | null;
  activeControl: string | null;
  onControlChange: (control: string | null) => void;
  /** Whether to show the Annotate button (requires ANNOTATIONS feature) */
  showAnnotate?: boolean;
}

interface ControlButton {
  id: string;
  label: string;
  icon: typeof Tag;
  description: string;
}

const controls: ControlButton[] = [
  {
    id: "tags",
    label: "Tags",
    icon: Tag,
    description: "View and interact with mattertags",
  },
  {
    id: "measure",
    label: "Measure",
    icon: Ruler,
    description: "Measure distances between points",
  },
  {
    id: "dollhouse",
    label: "Dollhouse",
    icon: Move3D,
    description: "Switch to dollhouse view",
  },
  {
    id: "floorplan",
    label: "Floor Plan",
    icon: Eye,
    description: "Switch to floor plan view",
  },
];

const annotateControl: ControlButton = {
  id: "annotate",
  label: "Annotate",
  icon: MessageSquarePlus,
  description: "Click a 3D location to add an annotation",
};

export function SDKControls({
  isMock,
  capture,
  activeControl,
  onControlChange,
  showAnnotate = false,
}: SDKControlsProps) {
  const allControls = showAnnotate
    ? [...controls, annotateControl]
    : controls;
  async function handleClick(controlId: string) {
    const isDeactivating = activeControl === controlId;
    onControlChange(isDeactivating ? null : controlId);

    // Wire buttons to real SDK methods when capture is available
    if (!capture || isDeactivating) {
      // On deactivate, reset to inside view
      if (isDeactivating && capture && (controlId === "dollhouse" || controlId === "floorplan")) {
        await capture.moveToInside();
      }
      return;
    }

    switch (controlId) {
      case "dollhouse":
        await capture.moveToDollhouse();
        break;
      case "floorplan":
        await capture.moveToFloorplan();
        break;
    }
  }

  const sdkUnavailable = !capture && !isMock;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {allControls.map((control) => (
          <Tooltip key={control.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClick(control.id)}
                disabled={sdkUnavailable}
                className={cn(
                  "h-8 gap-1.5 text-xs",
                  activeControl === control.id &&
                    "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                )}
              >
                <control.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{control.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{control.description}</p>
              {isMock && (
                <p className="text-xs text-muted-foreground">
                  Simulated in demo mode
                </p>
              )}
              {sdkUnavailable && (
                <p className="text-xs text-muted-foreground">
                  Requires SDK connection
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}

        {activeControl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  onControlChange(null);
                  if (capture) await capture.moveToInside();
                }}
                className="h-8 w-8 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Reset controls
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
