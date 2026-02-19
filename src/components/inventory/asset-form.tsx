"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAsset, updateAsset } from "@/actions/inventory";
import { toast } from "sonner";
import type { AssetItem } from "@prisma/client";

const CATEGORIES = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "FIXTURE", label: "Fixture" },
  { value: "ART", label: "Art" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "OTHER", label: "Other" },
];

const CONDITIONS = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

interface AssetFormProps {
  propertyId: string;
  asset?: AssetItem | null;
}

export function AssetForm({ propertyId, asset }: AssetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!asset;

  const [form, setForm] = useState({
    name: asset?.name || "",
    roomName: asset?.roomName || "",
    category: asset?.category || "OTHER",
    condition: asset?.condition || "GOOD",
    description: asset?.description || "",
    brand: asset?.brand || "",
    model: asset?.model || "",
    serialNumber: asset?.serialNumber || "",
    purchaseDate: asset?.purchaseDate
      ? new Date(asset.purchaseDate).toISOString().split("T")[0]
      : "",
    purchasePrice: asset?.purchasePrice?.toString() || "",
    estimatedValue: asset?.estimatedValue?.toString() || "",
    notes: asset?.notes || "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const payload = {
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      };

      const result = isEditing
        ? await updateAsset(asset!.id, payload)
        : await createAsset(propertyId, payload);

      if (result.success) {
        toast.success(isEditing ? "Asset updated" : "Asset created");
        router.push(`/properties/${propertyId}/inventory`);
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-[family-name:var(--font-heading)]">
          {isEditing ? "Edit Asset" : "New Asset"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomName">Room *</Label>
              <Input
                id="roomName"
                value={form.roomName}
                onChange={(e) => handleChange("roomName", e.target.value)}
                placeholder="e.g., Living Room, Kitchen"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => handleChange("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => handleChange("condition", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={form.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
              />
            </div>
          </div>

          {/* Value Info */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => handleChange("purchaseDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedValue}
                onChange={(e) => handleChange("estimatedValue", e.target.value)}
              />
            </div>
          </div>

          {/* Description & Notes */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              placeholder="Additional notes for insurance documentation..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Asset"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
