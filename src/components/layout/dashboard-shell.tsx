"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { signOut } from "next-auth/react";
import { FeatureKey } from "@prisma/client";

interface DashboardShellProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: "ADMIN" | "CUSTOMER";
  };
  enabledFeatures?: FeatureKey[];
  children: React.ReactNode;
}

export function DashboardShell({ user, enabledFeatures = [], children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        enabledFeatures={enabledFeatures}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
