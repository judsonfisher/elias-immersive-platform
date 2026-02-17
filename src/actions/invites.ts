"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { INVITE_EXPIRY_DAYS } from "@/lib/constants";
import { sendInviteEmail } from "@/lib/email";

export async function sendInviteAction(orgId: string, email: string) {
  await requireAdmin();

  // Check if user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return { success: false, error: "A user with this email already exists" };
  }

  // Check for pending invite to this email for this org
  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: orgId,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    return { success: false, error: "An invite is already pending for this email" };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.invite.create({
    data: {
      email: email.toLowerCase(),
      token,
      expiresAt,
      organizationId: orgId,
    },
    include: { organization: { select: { name: true } } },
  });

  try {
    await sendInviteEmail(email, invite.organization.name, token);
  } catch {
    // Email failed but invite was created — admin can share link manually
  }

  revalidatePath(`/admin/customers/${orgId}`);
  return { success: true, token };
}

export async function resendInvite(inviteId: string) {
  await requireAdmin();

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.invite.update({
    where: { id: inviteId },
    data: { token, expiresAt, status: "PENDING" },
    include: { organization: { select: { id: true, name: true } } },
  });

  try {
    await sendInviteEmail(invite.email, invite.organization.name, token);
  } catch {
    // Email failed
  }

  revalidatePath(`/admin/customers/${invite.organization.id}`);
  return { success: true };
}

export async function revokeInvite(inviteId: string) {
  await requireAdmin();

  const invite = await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "EXPIRED" },
    select: { organizationId: true },
  });

  revalidatePath(`/admin/customers/${invite.organizationId}`);
  return { success: true };
}
