"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { BCRYPT_SALT_ROUNDS, INVITE_EXPIRY_DAYS, PASSWORD_RESET_EXPIRY_HOURS } from "@/lib/constants";
import { sendInviteEmail, sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth-guard";
import { acceptInviteSchema, resetPasswordSchema } from "@/lib/validations";
import { AuthError } from "next-auth";

// ─── Login ───────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

// ─── Accept Invite ───────────────────────────────────────────────────

export async function acceptInvite(
  token: string,
  data: { firstName: string; lastName: string; password: string; confirmPassword: string }
) {
  // Server-side validation
  const validated = acceptInviteSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Invalid input" };
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite) {
    return { success: false, error: "Invalid invite link" };
  }

  if (invite.status !== "PENDING") {
    return { success: false, error: "This invite has already been used" };
  }

  if (new Date() > invite.expiresAt) {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { success: false, error: "This invite has expired. Please contact your admin for a new one." };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

  // Create user and accept invite in a transaction
  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "CUSTOMER",
        organizationId: invite.organizationId,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  // Send welcome email
  try {
    await sendWelcomeEmail(invite.email, data.firstName);
  } catch {
    // Don't fail the invite acceptance if email fails
  }

  return { success: true };
}

// ─── Get Invite by Token ─────────────────────────────────────────────

export async function getInviteByToken(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) return null;

  if (invite.status !== "PENDING" || new Date() > invite.expiresAt) {
    if (invite.status === "PENDING") {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
    }
    return { ...invite, status: "EXPIRED" as const };
  }

  return invite;
}

// ─── Send Invite ─────────────────────────────────────────────────────

export async function sendInvite(organizationId: string, email: string) {
  await requireAdmin();

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.invite.create({
    data: {
      email: email.toLowerCase(),
      token,
      expiresAt,
      organizationId,
    },
    include: { organization: { select: { name: true } } },
  });

  try {
    await sendInviteEmail(email, invite.organization.name, token);
  } catch {
    // If email fails, still return the invite so admin can share the link manually
  }

  return { success: true, inviteId: invite.id, token };
}

// ─── Request Password Reset ──────────────────────────────────────────

export async function requestPasswordReset(email: string) {
  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase(), isActive: true },
  });

  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    await prisma.passwordReset.create({
      data: { email: email.toLowerCase(), token, expiresAt },
    });

    try {
      await sendPasswordResetEmail(email, token);
    } catch {
      // Don't expose email sending failures
    }
  }

  return { success: true };
}

// ─── Reset Password ──────────────────────────────────────────────────

export async function resetPassword(token: string, newPassword: string, confirmPassword: string) {
  // Server-side validation
  const validated = resetPasswordSchema.safeParse({ password: newPassword, confirmPassword });
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Invalid input" };
  }

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  });

  if (!resetRecord) {
    return { success: false, error: "Invalid reset link" };
  }

  if (resetRecord.usedAt) {
    return { success: false, error: "This reset link has already been used" };
  }

  if (new Date() > resetRecord.expiresAt) {
    return { success: false, error: "This reset link has expired" };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetRecord.email },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
