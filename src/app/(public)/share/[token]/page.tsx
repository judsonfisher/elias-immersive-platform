import { notFound } from "next/navigation";
import { validateShareLink } from "@/actions/share-links";
import { EnhancedScanViewer } from "@/components/dashboard/enhanced-scan-viewer";
import { isMockMode } from "@/lib/matterport";
import { SharePasswordForm } from "./password-form";
import { ScanLine } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateShareLink(token);
  if (result.valid) {
    return { title: `${result.property.name} — Shared View` };
  }
  return { title: "Shared Property" };
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { token } = await params;
  const { p: password } = await searchParams;

  const result = await validateShareLink(token, password);

  // Invalid or expired link
  if (!result.valid && !result.needsPassword) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <ScanLine className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-xl font-semibold">Link Unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.error}
          </p>
        </div>
      </div>
    );
  }

  // Password required
  if (!result.valid && result.needsPassword) {
    return <SharePasswordForm token={token} />;
  }

  // Valid — render the scan viewer
  if (!result.valid) return notFound();

  const { property } = result;

  return (
    <div className="px-6 py-6 space-y-4">
      {/* Property header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
        {(property.address || property.city) && (
          <p className="text-sm text-muted-foreground">
            {[property.address, property.city, property.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {/* Scan viewer */}
      {property.scans.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <EnhancedScanViewer
            scans={property.scans}
            propertyName={property.name}
            isMock={isMockMode()}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <ScanLine className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium">No scans available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This property doesn&apos;t have any scans yet.
          </p>
        </div>
      )}
    </div>
  );
}
