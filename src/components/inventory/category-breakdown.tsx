"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CategoryBreakdownProps {
  categories: { name: string; count: number; value: number }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const CATEGORY_COLORS: Record<string, string> = {
  FURNITURE: "#4a5440",
  ELECTRONICS: "#5a6a4e",
  APPLIANCE: "#6b7a5e",
  FIXTURE: "#7c8a6e",
  ART: "#8c9c7c",
  JEWELRY: "#9cac8c",
  CLOTHING: "#acbc9c",
  OTHER: "#bccca8",
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const totalValue = categories.reduce((sum, c) => sum + c.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Value by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="h-full transition-all"
                  style={{
                    width: `${totalValue > 0 ? (cat.value / totalValue) * 100 : 0}%`,
                    backgroundColor: CATEGORY_COLORS[cat.name] || "#4a5440",
                    minWidth: cat.value > 0 ? "4px" : "0",
                  }}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor: CATEGORY_COLORS[cat.name] || "#4a5440",
                      }}
                    />
                    <Badge variant="secondary" className="text-xs capitalize">
                      {cat.name.toLowerCase().replace("_", " ")}
                    </Badge>
                    <span className="text-muted-foreground">
                      ({cat.count})
                    </span>
                  </span>
                  <span className="font-medium">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
