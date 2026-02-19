"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, Home, Layers } from "lucide-react";

interface InventoryStatsProps {
  totalItems: number;
  totalValue: number;
  roomCount: number;
  categoryCount: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function InventoryStats({
  totalItems,
  totalValue,
  roomCount,
  categoryCount,
}: InventoryStatsProps) {
  const stats = [
    { label: "Total Items", value: totalItems.toLocaleString(), icon: Package },
    { label: "Total Value", value: formatCurrency(totalValue), icon: DollarSign },
    { label: "Rooms", value: roomCount.toLocaleString(), icon: Home },
    { label: "Categories", value: categoryCount.toLocaleString(), icon: Layers },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
