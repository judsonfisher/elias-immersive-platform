"use client";

import { FeatureKey } from "@prisma/client";
import { ReactNode } from "react";

interface FeatureGateProps {
  features: FeatureKey[];
  enabledFeatures: FeatureKey[];
  /** Require ALL listed features (default: require ANY) */
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client component that conditionally renders children based on
 * whether the user's organization has the required feature(s) enabled.
 *
 * The `enabledFeatures` array should be passed down from a server component
 * that calls `getOrgFeatures()`.
 */
export function FeatureGate({
  features,
  enabledFeatures,
  requireAll = false,
  children,
  fallback = null,
}: FeatureGateProps) {
  const hasAccess = requireAll
    ? features.every((f) => enabledFeatures.includes(f))
    : features.some((f) => enabledFeatures.includes(f));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
