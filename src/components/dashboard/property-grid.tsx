"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ScanLine } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  thumbnailUrl: string | null;
  _count: { scans: number };
}

export function PropertyGrid({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium">No properties yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your properties will appear here once your account is set up.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => {
        const location = [property.city, property.state]
          .filter(Boolean)
          .join(", ");

        return (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <Card className="group overflow-hidden transition-shadow hover:shadow-md">
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] bg-muted">
                {property.thumbnailUrl ? (
                  <Image
                    src={property.thumbnailUrl}
                    alt={property.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {property.name}
                </h3>
                {location && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {location}
                  </p>
                )}
                {property.address && (
                  <p className="text-sm text-muted-foreground">
                    {property.address}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {property._count.scans} scan
                    {property._count.scans !== 1 ? "s" : ""}
                  </span>
                  {property._count.scans > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      View
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
