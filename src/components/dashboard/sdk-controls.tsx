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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SDKControlsProps {
  isMock: boolean;
  activeControl: string | null;
  onControlChange: (control: string | null) => void;
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

export function SDKControls({
  isMock,
  activeControl,
  onControlChange,
}: SDKControlsProps) {
  function handleClick(controlId: string) {
    onControlChange(activeControl === controlId ? null : controlId);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {controls.map((control) => (
          <Tooltip key={control.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClick(control.id)}
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
            </TooltipContent>
          </Tooltip>
        ))}

        {activeControl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onControlChange(null)}
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
