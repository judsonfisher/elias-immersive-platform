import Image from "next/image";
import Link from "next/link";
import { MatterportSdkLoader } from "@/components/dashboard/matterport-sdk-loader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Elias Immersive"
            width={120}
            height={98}
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-muted-foreground">
            Shared View
          </span>
        </Link>
      </header>

      {/* SDK loader for analytics capture on shared/embedded scans */}
      <MatterportSdkLoader />

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
