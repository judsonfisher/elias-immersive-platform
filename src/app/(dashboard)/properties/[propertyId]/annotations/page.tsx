import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getPropertyAnnotations } from "@/actions/annotations";
import { Badge } from "@/components/ui/badge";
import {
  StickyNote,
  AlertTriangle,
  MessageSquare,
  MessageSquarePlus,
} from "lucide-react";

const typeIcons: Record<string, typeof StickyNote> = {
  NOTE: StickyNote,
  ISSUE: AlertTriangle,
  COMMENT: MessageSquare,
};

const typeLabels: Record<string, string> = {
  NOTE: "Note",
  ISSUE: "Issue",
  COMMENT: "Comment",
};

export default async function AnnotationsPage({
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

  await requireFeature(property.organizationId, "ANNOTATIONS");

  const annotations = await getPropertyAnnotations(propertyId);

  const openCount = annotations.filter((a) => a.status === "OPEN").length;
  const resolvedCount = annotations.filter(
    (a) => a.status === "RESOLVED"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Annotations</h2>
        <p className="text-sm text-muted-foreground">
          All annotations across scans in this property. Click &ldquo;Annotate&rdquo; in
          the scan viewer toolbar to add new annotations.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="secondary">{annotations.length}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Open:</span>
          <Badge variant="destructive">{openCount}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Resolved:</span>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {resolvedCount}
          </Badge>
        </div>
      </div>

      {/* Annotation list */}
      {annotations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <MessageSquarePlus className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-medium">No annotations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a scan and click the Annotate button in the toolbar to pin
            notes to 3D locations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {annotations.map((annotation) => {
            const Icon = typeIcons[annotation.type] || StickyNote;
            return (
              <div
                key={annotation.id}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {typeLabels[annotation.type]}
                    </span>
                    {annotation.status === "RESOLVED" ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Resolved
                      </Badge>
                    ) : (
                      annotation.type === "ISSUE" && (
                        <Badge
                          variant="destructive"
                          className="text-[10px]"
                        >
                          Open
                        </Badge>
                      )
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {annotation.scan.name}
                  </Badge>
                </div>
                <p className="text-sm">{annotation.content}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {annotation.author.firstName} {annotation.author.lastName}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(annotation.createdAt).toLocaleDateString()}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-[10px]">
                    ({annotation.positionX.toFixed(1)},{" "}
                    {annotation.positionY.toFixed(1)},{" "}
                    {annotation.positionZ.toFixed(1)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
