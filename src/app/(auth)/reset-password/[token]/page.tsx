import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Reset Password — Elias Immersive",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  });

  const isValid =
    resetRecord &&
    !resetRecord.usedAt &&
    new Date() < resetRecord.expiresAt;

  if (!isValid) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-[family-name:var(--font-heading)]">
            Invalid Reset Link
          </CardTitle>
          <CardDescription>
            {resetRecord?.usedAt
              ? "This reset link has already been used."
              : "This reset link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
