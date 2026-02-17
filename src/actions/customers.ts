"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validations";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function getCustomers(search?: string) {
  await requireAdmin();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
          { contactEmail: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  return prisma.organization.findMany({
    where,
    include: {
      _count: { select: { users: true, properties: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(orgId: string) {
  await requireAdmin();

  return prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      properties: {
        where: { isActive: true },
        include: {
          _count: { select: { scans: { where: { isActive: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      },
      invites: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createCustomer(formData: FormData) {
  await requireAdmin();

  const data = customerSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    notes: formData.get("notes"),
  });

  // Generate unique slug
  let slug = slugify(data.name);
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const org = await prisma.organization.create({
    data: {
      ...data,
      slug,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/admin/customers");
  return { success: true, orgId: org.id };
}

export async function updateCustomer(orgId: string, formData: FormData) {
  await requireAdmin();

  const data = customerSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    notes: formData.get("notes"),
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...data,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/admin/customers/${orgId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function deleteCustomer(orgId: string) {
  await requireAdmin();

  await prisma.organization.update({
    where: { id: orgId },
    data: { isActive: false },
  });

  revalidatePath("/admin/customers");
  return { success: true };
}
