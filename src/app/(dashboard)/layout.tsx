import { requireAuth } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getOrgFeatures } from "@/lib/features";
import { FeatureKey } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  let enabledFeatures: FeatureKey[] = [];
  if (session.user.organizationId) {
    enabledFeatures = await getOrgFeatures(session.user.organizationId);
  }

  return (
    <DashboardShell
      user={{
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
      }}
      enabledFeatures={enabledFeatures}
    >
      {children}
    </DashboardShell>
  );
}
