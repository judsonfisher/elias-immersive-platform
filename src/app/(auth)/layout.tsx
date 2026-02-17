import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Image
            src="/logo.svg"
            alt="Elias Immersive"
            width={200}
            height={163}
            className="mx-auto mb-8 h-20 w-auto brightness-0 invert"
            priority
          />
          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-heading)] mb-4">
            Digital Twin Platform
          </h1>
          <p className="text-white/80 text-lg">
            View your property&apos;s Matterport 3D tours and drone photogrammetry scans in one place.
          </p>
        </div>
      </div>

      {/* Right side — auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logo.svg"
              alt="Elias Immersive"
              width={160}
              height={130}
              className="mx-auto h-16 w-auto"
              priority
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
