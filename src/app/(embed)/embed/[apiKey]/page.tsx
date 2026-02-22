import { headers } from "next/headers";
import { validateEmbedApiKey } from "@/actions/embed-configs";
import { EnhancedScanViewer } from "@/components/dashboard/enhanced-scan-viewer";
import { isMockMode } from "@/lib/matterport";
import { Code } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ apiKey: string }>;
}) {
  const { apiKey } = await params;
  const result = await validateEmbedApiKey(apiKey);
  if (result.valid) {
    return {
      title: `${result.property.name} — Embedded View`,
      // Allow framing from any origin for embed pages
      other: { "X-Frame-Options": "ALLOWALL" },
    };
  }
  return { title: "Embedded Property" };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ apiKey: string }>;
}) {
  const { apiKey } = await params;

  // Get referrer for optional domain validation
  const headersList = await headers();
  const referrer = headersList.get("referer") || headersList.get("referrer");

  const result = await validateEmbedApiKey(apiKey, referrer);

  // Invalid config
  if (!result.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <Code className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-xl font-semibold">Embed Unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  const { property, showLogo } = result;

  // No scans
  if (property.scans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <Code className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium">No scans available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This property doesn&apos;t have any scans yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal scan viewer — no tab bar chrome, no fullscreen button */}
      <div className="flex-1">
        <EnhancedScanViewer
          scans={property.scans}
          propertyName={property.name}
          isMock={isMockMode()}
          minimal
        />
      </div>

      {/* Optional branding footer */}
      {showLogo && (
        <div className="flex items-center justify-center border-t border-border bg-card px-4 py-1.5">
          <span className="text-[10px] text-muted-foreground">
            Powered by Elias Immersive
          </span>
        </div>
      )}
    </div>
  );
}
