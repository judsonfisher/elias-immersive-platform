import { MatterportSdkLoader } from "@/components/dashboard/matterport-sdk-loader";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* SDK loader for analytics capture on embedded scans */}
      <MatterportSdkLoader />

      {/* Content — no header, no chrome, fully frameable */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
