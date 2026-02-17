"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createScan, updateScan } from "@/actions/scans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ExternalLink } from "lucide-react";
import { ALLOWED_EMBED_DOMAINS } from "@/lib/constants";

interface ScanFormProps {
  propertyId: string;
  orgId: string;
  scan?: {
    id: string;
    name: string;
    type: "MATTERPORT" | "NIRA";
    embedUrl: string;
    description: string | null;
  };
}

export function ScanForm({ propertyId, orgId, scan }: ScanFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(scan?.embedUrl || "");
  const [scanType, setScanType] = useState<string>(scan?.type || "");
  const isEditing = !!scan;

  function detectScanType(url: string) {
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes("matterport.com")) return "MATTERPORT";
      if (hostname.includes("nira.app")) return "NIRA";
    } catch {
      // invalid URL
    }
    return "";
  }

  function isValidEmbedUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return ALLOWED_EMBED_DOMAINS.some(
        (d) => hostname === d || hostname.endsWith(`.${d}`)
      );
    } catch {
      return false;
    }
  }

  function handleUrlChange(url: string) {
    setEmbedUrl(url);
    const detected = detectScanType(url);
    if (detected) {
      setScanType(detected);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEditing
        ? await updateScan(scan!.id, formData)
        : await createScan(propertyId, formData);

      if (result.success) {
        router.push(`/admin/customers/${orgId}/properties/${propertyId}`);
        router.refresh();
      } else if ("error" in result && typeof result.error === "string") {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showPreview = embedUrl && isValidEmbedUrl(embedUrl);

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)]">
            {isEditing ? "Edit Scan" : "Add Scan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="embedUrl">Embed URL *</Label>
              <Input
                id="embedUrl"
                name="embedUrl"
                type="url"
                required
                value={embedUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://my.matterport.com/show/?m=..."
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Paste the Matterport or Nira embed URL. The scan type will be
                detected automatically.
              </p>
              {embedUrl && !isValidEmbedUrl(embedUrl) && embedUrl.startsWith("http") && (
                <p className="text-xs text-destructive">
                  URL must be from {ALLOWED_EMBED_DOMAINS.join(", ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Scan Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={scan?.name}
                  placeholder="e.g., 3D Walkthrough"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Scan Type *</Label>
                <Select
                  name="type"
                  value={scanType}
                  onValueChange={setScanType}
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATTERPORT">Matterport</SelectItem>
                    <SelectItem value="NIRA">Nira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={scan?.description || ""}
                placeholder="Brief description of this scan..."
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Scan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {showPreview && (
        <Card className="max-w-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Embed Preview</CardTitle>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              <iframe
                src={embedUrl}
                className="h-full w-full"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
