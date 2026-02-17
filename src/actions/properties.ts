"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { propertySchema } from "@/lib/validations";

export async function createProperty(orgId: string, formData: FormData) {
  await requireAdmin();

  const data = propertySchema.parse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    description: formData.get("description"),
    thumbnailUrl: formData.get("thumbnailUrl"),
  });

  const property = await prisma.property.create({
    data: {
      ...data,
      organizationId: orgId,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
    },
  });

  revalidatePath(`/admin/customers/${orgId}`);
  return { success: true, propertyId: property.id };
}

export async function updateProperty(propertyId: string, formData: FormData) {
  await requireAdmin();

  const data = propertySchema.parse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    description: formData.get("description"),
    thumbnailUrl: formData.get("thumbnailUrl"),
  });

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      ...data,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
    },
  });

  revalidatePath(`/admin/customers/${property.organizationId}`);
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  await requireAdmin();

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: { isActive: false },
  });

  revalidatePath(`/admin/customers/${property.organizationId}`);
  return { success: true };
}

export async function getProperty(propertyId: string) {
  await requireAdmin();

  return prisma.property.findUnique({
    where: { id: propertyId, isActive: true },
    include: {
      scans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { id: true, name: true } },
    },
  });
}
