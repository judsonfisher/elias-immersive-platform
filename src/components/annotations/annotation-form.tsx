"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, MapPin } from "lucide-react";
import { createAnnotation } from "@/actions/annotations";
import { toast } from "sonner";

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface AnnotationFormProps {
  scanId: string;
  position: Position3D;
  onClose: () => void;
  onCreated: () => void;
}

const ANNOTATION_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
];

export function AnnotationForm({
  scanId,
  position,
  onClose,
  onCreated,
}: AnnotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"NOTE" | "ISSUE" | "COMMENT">("NOTE");
  const [color, setColor] = useState("#ef4444");
  const [content, setContent] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await createAnnotation({
          scanId,
          content: content.trim(),
          type,
          positionX: position.x,
          positionY: position.y,
          positionZ: position.z,
          color,
        });
        toast.success("Annotation created");
        onCreated();
      } catch {
        toast.error("Failed to create annotation");
      }
    });
  }

  return (
    <div className="border-b border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          New Annotation
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Position display */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
        <span>X: {position.x.toFixed(2)}</span>
        <span>Y: {position.y.toFixed(2)}</span>
        <span>Z: {position.z.toFixed(2)}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type selector */}
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "NOTE" | "ISSUE" | "COMMENT")}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOTE">Note</SelectItem>
              <SelectItem value="ISSUE">Issue</SelectItem>
              <SelectItem value="COMMENT">Comment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <Label className="text-xs">Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe what you see at this location..."
            className="min-h-[80px] text-xs resize-none"
            maxLength={2000}
          />
        </div>

        {/* Color picker */}
        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <div className="flex items-center gap-1.5">
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c.value
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isPending || !content.trim()}
        >
          {isPending ? "Saving..." : "Save Annotation"}
        </Button>
      </form>
    </div>
  );
}
