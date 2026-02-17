import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function requireOrgAccess(organizationId: string) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") return session;
  if (session.user.organizationId !== organizationId) redirect("/dashboard");
  return session;
}
