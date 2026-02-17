import { getInviteByToken } from "@/actions/auth";
import { InviteForm } from "@/components/auth/invite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Accept Invite — Elias Immersive",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite || invite.status === "EXPIRED" || invite.status === "ACCEPTED") {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-[family-name:var(--font-heading)]">
            Invalid Invite
          </CardTitle>
          <CardDescription>
            {invite?.status === "ACCEPTED"
              ? "This invite has already been used."
              : invite?.status === "EXPIRED"
                ? "This invite has expired. Please contact your admin for a new one."
                : "This invite link is invalid."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <InviteForm
      token={token}
      email={invite.email}
      organizationName={invite.organization.name}
    />
  );
}
