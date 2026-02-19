import { notFound } from "next/navigation";
import Link from "next/link";
import { getAsset, deleteAsset } from "@/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "@/components/inventory/condition-badges";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AssetDeleteButton } from "@/components/inventory/asset-delete-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ propertyId: string; assetId: string }>;
}) {
  const { assetId } = await params;
  const asset = await getAsset(assetId);
  return {
    title: `${asset?.name || "Asset"} — Elias Immersive`,
  };
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string; assetId: string }>;
}) {
  const { propertyId, assetId } = await params;
  const asset = await getAsset(assetId);

  if (!asset) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/properties/${propertyId}/inventory`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inventory
          </Link>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
            {asset.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {asset.category.toLowerCase().replace("_", " ")}
            </Badge>
            <ConditionBadge condition={asset.condition} size="md" />
            <span className="text-sm text-muted-foreground">
              {asset.roomName}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <AssetDeleteButton assetId={assetId} propertyId={propertyId} />
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Brand" value={asset.brand} />
            <DetailRow label="Model" value={asset.model} />
            <DetailRow label="Serial Number" value={asset.serialNumber} />
            {asset.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{asset.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value & Purchase Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Estimated Value"
              value={formatCurrency(asset.estimatedValue)}
              highlight
            />
            <DetailRow
              label="Purchase Price"
              value={formatCurrency(asset.purchasePrice)}
            />
            <DetailRow
              label="Purchase Date"
              value={
                asset.purchaseDate
                  ? new Date(asset.purchaseDate).toLocaleDateString()
                  : null
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {asset.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.photos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No photos attached. Photo upload will be available when the
                Matterport SDK is connected.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {asset.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || asset.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold" : "text-sm"}>
        {value || "—"}
      </span>
    </div>
  );
}
