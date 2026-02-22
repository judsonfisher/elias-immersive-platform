"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { requireFeature } from "@/lib/features";
import { createEmbedConfigSchema } from "@/lib/validations";
import { EMBED_API_KEY_LENGTH, APP_URL } from "@/lib/constants";

/**
 * Generate a URL-safe API key.
 */
function generateApiKey(): string {
  return randomBytes(EMBED_API_KEY_LENGTH).toString("base64url");
}

export async function createEmbedConfig(formData: FormData) {
  const session = await requireAuth();

  const rawData = {
    propertyId: formData.get("propertyId") as string,
    allowedDomains: (formData.get("allowedDomains") as string)
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
    brandingColor: (formData.get("brandingColor") as string) || undefined,
    showLogo: formData.get("showLogo") !== "false",
  };

  const data = createEmbedConfigSchema.parse(rawData);

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

  await requireFeature(property.organizationId, "EMBED_WIDGET");

  const apiKey = generateApiKey();

  const config = await prisma.embedConfig.create({
    data: {
      apiKey,
      allowedDomains: data.allowedDomains,
      brandingColor: data.brandingColor || null,
      showLogo: data.showLogo ?? true,
      propertyId: data.propertyId,
    },
  });

  revalidatePath(`/properties/${data.propertyId}/embed`);

  return {
    id: config.id,
    apiKey: config.apiKey,
    embedUrl: `${APP_URL}/embed/${config.apiKey}`,
  };
}

export async function updateEmbedConfig(
  id: string,
  updates: {
    allowedDomains?: string[];
    brandingColor?: string | null;
    showLogo?: boolean;
  }
) {
  const session = await requireAuth();

  const config = await prisma.embedConfig.findUnique({
    where: { id },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!config) throw new Error("Embed config not found");

  if (
    session.user.role !== "ADMIN" &&
    config.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.embedConfig.update({
    where: { id },
    data: {
      ...(updates.allowedDomains !== undefined
        ? { allowedDomains: updates.allowedDomains }
        : {}),
      ...(updates.brandingColor !== undefined
        ? { brandingColor: updates.brandingColor }
        : {}),
      ...(updates.showLogo !== undefined
        ? { showLogo: updates.showLogo }
        : {}),
    },
  });

  revalidatePath(`/properties/${config.propertyId}/embed`);
}

export async function revokeEmbedConfig(id: string) {
  const session = await requireAuth();

  const config = await prisma.embedConfig.findUnique({
    where: { id },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!config) throw new Error("Embed config not found");

  if (
    session.user.role !== "ADMIN" &&
    config.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  await prisma.embedConfig.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath(`/properties/${config.propertyId}/embed`);
}

export async function regenerateApiKey(id: string) {
  const session = await requireAuth();

  const config = await prisma.embedConfig.findUnique({
    where: { id },
    include: { property: { select: { organizationId: true, id: true } } },
  });

  if (!config) throw new Error("Embed config not found");

  if (
    session.user.role !== "ADMIN" &&
    config.property.organizationId !== session.user.organizationId
  ) {
    throw new Error("Unauthorized");
  }

  const newApiKey = generateApiKey();

  await prisma.embedConfig.update({
    where: { id },
    data: { apiKey: newApiKey },
  });

  revalidatePath(`/properties/${config.propertyId}/embed`);

  return {
    apiKey: newApiKey,
    embedUrl: `${APP_URL}/embed/${newApiKey}`,
  };
}

export async function getEmbedConfigs(propertyId: string) {
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

  return prisma.embedConfig.findMany({
    where: { propertyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Validate an embed API key (public — no auth required).
 * Returns the property with scans if valid, or an error object.
 * Optionally checks the referrer against allowedDomains.
 */
export async function validateEmbedApiKey(
  apiKey: string,
  referrer?: string | null
): Promise<
  | {
      valid: true;
      property: {
        id: string;
        name: string;
        scans: {
          id: string;
          name: string;
          type: "MATTERPORT" | "NIRA";
          embedUrl: string;
          matterportSid: string | null;
          description: string | null;
        }[];
      };
      brandingColor: string | null;
      showLogo: boolean;
    }
  | { valid: false; error: string }
> {
  const config = await prisma.embedConfig.findUnique({
    where: { apiKey },
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

  if (!config || !config.isActive) {
    return { valid: false, error: "Invalid or revoked embed configuration." };
  }

  if (!config.property.isActive) {
    return { valid: false, error: "This property is no longer available." };
  }

  // Optional referrer check (defense-in-depth — API key is the real auth)
  if (referrer && config.allowedDomains.length > 0) {
    try {
      const referrerHost = new URL(referrer).hostname;
      const isAllowed = config.allowedDomains.some((domain) => {
        // Support wildcard subdomains: *.example.com
        if (domain.startsWith("*.")) {
          const base = domain.slice(2);
          return referrerHost === base || referrerHost.endsWith(`.${base}`);
        }
        return referrerHost === domain;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: "This embed is not authorized for this domain.",
        };
      }
    } catch {
      // If referrer can't be parsed, allow access (referrer is unreliable)
    }
  }

  return {
    valid: true,
    property: {
      id: config.property.id,
      name: config.property.name,
      scans: config.property.scans,
    },
    brandingColor: config.brandingColor,
    showLogo: config.showLogo,
  };
}
