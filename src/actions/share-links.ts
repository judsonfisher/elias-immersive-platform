"use server";

import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { createShareLinkSchema } from "@/lib/validations";
import {
  BCRYPT_SALT_ROUNDS,
  SHARE_LINK_DEFAULT_EXPIRY_DAYS,
  APP_URL,
} from "@/lib/constants";
import { sendShareLinkEmail } from "@/lib/email";

export async function createShareLink(formData: FormData) {
  const session = await requireAuth();

  const rawData = {
    propertyId: formData.get("propertyId") as string,
    expiresInDays: Number(formData.get("expiresInDays")) || SHARE_LINK_DEFAULT_EXPIRY_DAYS,
    password: (formData.get("password") as string) || undefined,
    maxViews: formData.get("maxViews") ? Number(formData.get("maxViews")) : undefined,
  };

  const data = createShareLinkSchema.parse(rawData);

  // Verify property access
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

  if (!property) {
    throw new Error("Property not found");
  }

  await requireFeature(property.organizationId, "SHARE_LINKS");

  const token = randomBytes(32).toString("hex");
  const passwordHash = data.password && data.password.length >= 4
    ? await hash(data.password, BCRYPT_SALT_ROUNDS)
    : null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

  const shareLink = await prisma.shareLink.create({
    data: {
      token,
      passwordHash,
      expiresAt,
      maxViews: data.maxViews ?? null,
      propertyId: data.propertyId,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/properties/${data.propertyId}/share`);

  return {
    id: shareLink.id,
    token: shareLink.token,
    url: `${APP_URL}/share/${shareLink.token}`,
  };
}

export async function revokeShareLink(id: string) {
  const session = await requireAuth();

  const shareLink = await prisma.shareLink.findUnique({
    where: { id },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!shareLink) throw new Error("Share link not found");

  // Verify access
  if (
    session.user.role !== "ADMIN" &&
    shareLink.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.shareLink.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath(`/properties/${shareLink.propertyId}/share`);
}

export async function getShareLinks(propertyId: string) {
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

  return prisma.shareLink.findMany({
    where: { propertyId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

/**
 * Validate a share link token (public — no auth required).
 * Returns the property with scans if valid, or an error object.
 */
export async function validateShareLink(
  token: string,
  password?: string
): Promise<
  | {
      valid: true;
      needsPassword: false;
      property: {
        id: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        scans: {
          id: string;
          name: string;
          type: "MATTERPORT" | "NIRA";
          embedUrl: string;
          matterportSid: string | null;
          description: string | null;
        }[];
      };
    }
  | { valid: false; needsPassword: true }
  | { valid: false; needsPassword: false; error: string }
> {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      property: {
        include: {
          scans: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              type: true,
              embedUrl: true,
              matterportSid: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!shareLink || !shareLink.isActive) {
    return { valid: false, needsPassword: false, error: "Link not found or has been revoked." };
  }

  if (shareLink.expiresAt < new Date()) {
    return { valid: false, needsPassword: false, error: "This link has expired." };
  }

  if (shareLink.maxViews && shareLink.accessCount >= shareLink.maxViews) {
    return { valid: false, needsPassword: false, error: "This link has reached its maximum view count." };
  }

  // Check password
  if (shareLink.passwordHash) {
    if (!password) {
      return { valid: false, needsPassword: true };
    }
    const isValid = await compare(password, shareLink.passwordHash);
    if (!isValid) {
      return { valid: false, needsPassword: true };
    }
  }

  // Increment access count
  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

  return {
    valid: true,
    needsPassword: false,
    property: {
      id: shareLink.property.id,
      name: shareLink.property.name,
      address: shareLink.property.address,
      city: shareLink.property.city,
      state: shareLink.property.state,
      scans: shareLink.property.scans,
    },
  };
}

export async function emailShareLink(
  shareLinkId: string,
  recipientEmail: string
) {
  const session = await requireAuth();

  const shareLink = await prisma.shareLink.findUnique({
    where: { id: shareLinkId },
    include: {
      property: { select: { name: true, organizationId: true } },
    },
  });

  if (!shareLink) throw new Error("Share link not found");

  if (
    session.user.role !== "ADMIN" &&
    shareLink.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  const shareUrl = `${APP_URL}/share/${shareLink.token}`;
  const senderName = `${session.user.firstName} ${session.user.lastName}`;

  await sendShareLinkEmail(
    recipientEmail,
    shareLink.property.name,
    shareUrl,
    senderName
  );
}
