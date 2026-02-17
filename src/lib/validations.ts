import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const acceptInviteSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(255),
    lastName: z.string().min(1, "Last name is required").max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Organization (Customer) ─────────────────────────────────────────

export const customerSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255),
  contactName: z.string().max(255).optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

// ─── Property ────────────────────────────────────────────────────────

export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(255),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(255).optional().or(z.literal("")),
  state: z.string().max(255).optional().or(z.literal("")),
  zipCode: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

// ─── Scan ────────────────────────────────────────────────────────────

const ALLOWED_EMBED_DOMAINS = [
  "my.matterport.com",
  "nira.app",
  "app.nira.app",
];

export const scanSchema = z.object({
  name: z.string().min(1, "Scan name is required").max(255),
  type: z.enum(["MATTERPORT", "NIRA"]),
  embedUrl: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (url) => {
        try {
          const hostname = new URL(url).hostname;
          return ALLOWED_EMBED_DOMAINS.some(
            (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "Embed URL must be from an allowed domain (matterport.com or nira.app)",
      }
    ),
  description: z.string().max(2000).optional().or(z.literal("")),
});

// ─── Invite ──────────────────────────────────────────────────────────

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─── Settings ────────────────────────────────────────────────────────

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const phoneVerificationSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20),
});

export const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});
