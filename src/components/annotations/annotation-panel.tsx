"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  AlertTriangle,
  StickyNote,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  Navigation,
} from "lucide-react";
import {
  resolveAnnotation,
  reopenAnnotation,
  deleteAnnotation,
} from "@/actions/annotations";
import { toast } from "sonner";

interface AnnotationData {
  id: string;
  content: string;
  type: "NOTE" | "ISSUE" | "COMMENT";
  status: "OPEN" | "RESOLVED";
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  createdAt: Date;
  author: { firstName: string; lastName: string };
}

interface AnnotationPanelProps {
  annotations: AnnotationData[];
  onNavigate?: (position: { x: number; y: number; z: number }) => void;
  onRefresh?: () => void;
}

const typeIcons = {
  NOTE: StickyNote,
  ISSUE: AlertTriangle,
  COMMENT: MessageSquare,
};

const typeLabels = {
  NOTE: "Note",
  ISSUE: "Issue",
  COMMENT: "Comment",
};

export function AnnotationPanel({
  annotations,
  onNavigate,
  onRefresh,
}: AnnotationPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RESOLVED">(
    "ALL"
  );

  const filtered = annotations.filter((a) => {
    const matchesSearch =
      !search ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      `${a.author.firstName} ${a.author.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-border bg-card py-3 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="mt-2 flex flex-col items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1">
            {annotations.length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col border-l border-border bg-card">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-medium">
          Annotations{" "}
          <span className="text-muted-foreground">({annotations.length})</span>
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(true)}
          className="h-7 w-7"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-2 border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search annotations..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="h-6 text-[10px] flex-1"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              {annotations.length === 0
                ? "No annotations yet"
                : "No matching annotations"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((annotation) => (
              <AnnotationRow
                key={annotation.id}
                annotation={annotation}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnotationRow({
  annotation,
  onNavigate,
  onRefresh,
}: {
  annotation: AnnotationData;
  onNavigate?: (position: { x: number; y: number; z: number }) => void;
  onRefresh?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const Icon = typeIcons[annotation.type];

  function handleNavigate() {
    onNavigate?.({
      x: annotation.positionX,
      y: annotation.positionY,
      z: annotation.positionZ,
    });
  }

  function handleResolve() {
    startTransition(async () => {
      try {
        await resolveAnnotation(annotation.id);
        toast.success("Annotation resolved");
        onRefresh?.();
      } catch {
        toast.error("Failed to resolve");
      }
    });
  }

  function handleReopen() {
    startTransition(async () => {
      try {
        await reopenAnnotation(annotation.id);
        toast.success("Annotation reopened");
        onRefresh?.();
      } catch {
        toast.error("Failed to reopen");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAnnotation(annotation.id);
        toast.success("Annotation deleted");
        onRefresh?.();
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  return (
    <div className="p-3 space-y-2 hover:bg-muted/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: annotation.color }}
          />
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {typeLabels[annotation.type]}
          </span>
          {annotation.status === "RESOLVED" ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            >
              Resolved
            </Badge>
          ) : (
            annotation.type === "ISSUE" && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Open
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-xs leading-relaxed">{annotation.content}</p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {annotation.author.firstName} {annotation.author.lastName} ·{" "}
          {new Date(annotation.createdAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-0.5">
          {onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigate}
              title="Navigate to position"
              className="h-6 w-6"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          )}
          {annotation.status === "OPEN" ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResolve}
              disabled={isPending}
              title="Resolve"
              className="h-6 w-6 text-green-600 hover:text-green-600"
            >
              <CheckCircle2 className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReopen}
              disabled={isPending}
              title="Reopen"
              className="h-6 w-6"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete"
            className="h-6 w-6 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
