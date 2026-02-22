"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Package,
  Link,
  MessageSquarePlus,
  Code,
  CalendarClock,
} from "lucide-react";
import { enableFeature, disableFeature } from "@/actions/features";
import { FeatureKey } from "@prisma/client";
import { FEATURE_METADATA } from "@/lib/features";

const iconMap = {
  BarChart3,
  Package,
  Link,
  MessageSquarePlus,
  Code,
  CalendarClock,
} as const;

interface FeatureToggleCardProps {
  organizationId: string;
  featureKey: FeatureKey;
  enabled: boolean;
  enabledAt: Date | null;
}

export function FeatureToggleCard({
  organizationId,
  featureKey,
  enabled,
  enabledAt,
}: FeatureToggleCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(enabled);

  const meta = FEATURE_METADATA[featureKey];
  const Icon = iconMap[meta.icon as keyof typeof iconMap] || BarChart3;

  function handleToggle() {
    startTransition(async () => {
      if (isEnabled) {
        await disableFeature(organizationId, featureKey);
        setIsEnabled(false);
      } else {
        await enableFeature(organizationId, featureKey);
        setIsEnabled(true);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{meta.label}</h3>
            {isEnabled ? (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          {isEnabled && enabledAt && (
            <p className="text-xs text-muted-foreground">
              Enabled {new Date(enabledAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button
          variant={isEnabled ? "outline" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
        >
          {isPending ? "..." : isEnabled ? "Disable" : "Enable"}
        </Button>
      </CardContent>
    </Card>
  );
}
