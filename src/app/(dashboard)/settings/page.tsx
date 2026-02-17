import { getProfile } from "@/actions/settings";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Settings — Elias Immersive",
};

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-1">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings.
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
            {profile.organization && (
              <div>
                <p className="text-muted-foreground">Organization</p>
                <p className="font-medium">{profile.organization.name}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last login</p>
              <p className="font-medium">
                {profile.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="max-w-2xl space-y-6">
        <ProfileForm user={profile} />
        <PasswordForm />
      </div>
    </div>
  );
}
