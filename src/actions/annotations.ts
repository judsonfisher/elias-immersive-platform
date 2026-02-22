"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import {
  createAnnotationSchema,
  updateAnnotationSchema,
} from "@/lib/validations";
import type { AnnotationType, AnnotationStatus } from "@prisma/client";

export async function createAnnotation(data: {
  scanId: string;
  content: string;
  type: AnnotationType;
  positionX: number;
  positionY: number;
  positionZ: number;
  color?: string;
}) {
  const session = await requireAuth();

  const parsed = createAnnotationSchema.parse(data);

  // Verify scan access
  const scan = await prisma.scan.findFirst({
    where: {
      id: parsed.scanId,
      isActive: true,
      property: {
        isActive: true,
        ...(session.user.role !== "ADMIN"
          ? { organizationId: session.user.organizationId! }
          : {}),
      },
    },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!scan) throw new Error("Scan not found");

  await requireFeature(scan.property.organizationId, "ANNOTATIONS");

  const annotation = await prisma.annotation.create({
    data: {
      content: parsed.content,
      type: parsed.type as AnnotationType,
      color: parsed.color || "#ef4444",
      positionX: parsed.positionX,
      positionY: parsed.positionY,
      positionZ: parsed.positionZ,
      scanId: parsed.scanId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
  });

  revalidatePath(`/properties/${scan.property.id}`);
  revalidatePath(`/properties/${scan.property.id}/annotations`);

  return annotation;
}

export async function updateAnnotation(
  id: string,
  updates: { content?: string; status?: AnnotationStatus }
) {
  const session = await requireAuth();

  const parsed = updateAnnotationSchema.parse(updates);

  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      scan: {
        include: {
          property: { select: { organizationId: true, id: true } },
        },
      },
    },
  });

  if (!annotation) throw new Error("Annotation not found");

  if (
    session.user.role !== "ADMIN" &&
    annotation.scan.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.annotation.update({
    where: { id },
    data: {
      ...(parsed.content !== undefined ? { content: parsed.content } : {}),
      ...(parsed.status !== undefined
        ? { status: parsed.status as AnnotationStatus }
        : {}),
    },
  });

  revalidatePath(`/properties/${annotation.scan.property.id}`);
  revalidatePath(`/properties/${annotation.scan.property.id}/annotations`);
}

export async function resolveAnnotation(id: string) {
  return updateAnnotation(id, { status: "RESOLVED" as AnnotationStatus });
}

export async function reopenAnnotation(id: string) {
  return updateAnnotation(id, { status: "OPEN" as AnnotationStatus });
}

export async function deleteAnnotation(id: string) {
  const session = await requireAuth();

  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      scan: {
        include: {
          property: { select: { organizationId: true, id: true } },
        },
      },
    },
  });

  if (!annotation) throw new Error("Annotation not found");

  if (
    session.user.role !== "ADMIN" &&
    annotation.scan.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.annotation.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath(`/properties/${annotation.scan.property.id}`);
  revalidatePath(`/properties/${annotation.scan.property.id}/annotations`);
}

export async function getAnnotations(scanId: string) {
  const session = await requireAuth();

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      isActive: true,
      property: {
        isActive: true,
        ...(session.user.role !== "ADMIN"
          ? { organizationId: session.user.organizationId! }
          : {}),
      },
    },
    select: { id: true },
  });

  if (!scan) throw new Error("Scan not found");

  return prisma.annotation.findMany({
    where: { scanId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getPropertyAnnotations(propertyId: string) {
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

  return prisma.annotation.findMany({
    where: {
      isActive: true,
      scan: { propertyId, isActive: true },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { firstName: true, lastName: true } },
      scan: { select: { name: true, id: true } },
    },
  });
}
