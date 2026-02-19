"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConditionBadge } from "./condition-badges";
import { Search } from "lucide-react";
import type { AssetItem, AssetPhoto } from "@prisma/client";

type AssetWithPhotos = AssetItem & { photos: AssetPhoto[] };

interface AssetListProps {
  assets: AssetWithPhotos[];
  propertyId: string;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AssetList({ assets, propertyId }: AssetListProps) {
  const [search, setSearch] = useState("");

  const filtered = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.roomName.toLowerCase().includes(search.toLowerCase()) ||
      asset.category.toLowerCase().includes(search.toLowerCase()) ||
      (asset.brand && asset.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Assets ({assets.length})
        </CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {assets.length === 0
              ? "No assets cataloged yet."
              : "No assets match your search."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Est. Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/properties/${propertyId}/inventory/${asset.id}`}
                      className="font-medium hover:underline"
                    >
                      {asset.name}
                    </Link>
                    {asset.brand && (
                      <p className="text-xs text-muted-foreground">
                        {asset.brand}
                        {asset.model ? ` ${asset.model}` : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{asset.roomName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {asset.category.toLowerCase().replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ConditionBadge condition={asset.condition} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(asset.estimatedValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
