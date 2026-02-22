"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ScanLine,
  BarChart3,
  Package,
  Download,
  Link as LinkIcon,
  MessageSquarePlus,
  Code,
  CalendarClock,
} from "lucide-react";
import type { FeatureKey } from "@prisma/client";

interface PropertyTabsProps {
  propertyId: string;
  enabledFeatures: FeatureKey[];
}

interface Tab {
  href: string;
  label: string;
  icon: typeof ScanLine;
  requiredFeature?: FeatureKey;
  /** Match when pathname equals exactly (default) or starts with the href */
  exact?: boolean;
}

export function PropertyTabs({ propertyId, enabledFeatures }: PropertyTabsProps) {
  const pathname = usePathname();

  const basePath = `/properties/${propertyId}`;

  const allTabs: Tab[] = [
    { href: basePath, label: "Scans", icon: ScanLine, exact: true },
    {
      href: `${basePath}/analytics`,
      label: "Analytics",
      icon: BarChart3,
      requiredFeature: "ANALYTICS" as FeatureKey,
    },
    {
      href: `${basePath}/inventory`,
      label: "Inventory",
      icon: Package,
      requiredFeature: "INVENTORY" as FeatureKey,
    },
    {
      href: `${basePath}/share`,
      label: "Share",
      icon: LinkIcon,
      requiredFeature: "SHARE_LINKS" as FeatureKey,
    },
    {
      href: `${basePath}/annotations`,
      label: "Annotations",
      icon: MessageSquarePlus,
      requiredFeature: "ANNOTATIONS" as FeatureKey,
    },
    {
      href: `${basePath}/embed`,
      label: "Embed",
      icon: Code,
      requiredFeature: "EMBED_WIDGET" as FeatureKey,
    },
    {
      href: `${basePath}/reports`,
      label: "Reports",
      icon: CalendarClock,
      requiredFeature: "SCHEDULED_REPORTS" as FeatureKey,
    },
    {
      href: `${basePath}/exports`,
      label: "Exports",
      icon: Download,
      // Exports requires at least one premium feature — don't gate on a single one
    },
  ];

  // Filter tabs by enabled features
  const tabs = allTabs.filter((tab) => {
    if (!tab.requiredFeature) {
      // Exports tab: show only when at least one premium feature is enabled
      if (tab.label === "Exports") {
        return enabledFeatures.length > 0;
      }
      return true;
    }
    // Reports requires both ANALYTICS and SCHEDULED_REPORTS
    if (tab.label === "Reports") {
      return (
        enabledFeatures.includes("ANALYTICS" as FeatureKey) &&
        enabledFeatures.includes("SCHEDULED_REPORTS" as FeatureKey)
      );
    }
    return enabledFeatures.includes(tab.requiredFeature);
  });

  // Don't render tabs bar if there's only the Scans tab
  if (tabs.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
