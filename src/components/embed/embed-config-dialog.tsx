"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Copy, Check } from "lucide-react";
import { createEmbedConfig } from "@/actions/embed-configs";
import { EmbedSnippetDisplay } from "./embed-snippet-display";
import { toast } from "sonner";

interface EmbedConfigDialogProps {
  propertyId: string;
}

export function EmbedConfigDialog({ propertyId }: EmbedConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    id: string;
    apiKey: string;
    embedUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate(formData: FormData) {
    formData.set("propertyId", propertyId);
    startTransition(async () => {
      try {
        const config = await createEmbedConfig(formData);
        setResult(config);
        toast.success("Embed config created");
      } catch {
        toast.error("Failed to create embed config");
      }
    });
  }

  async function handleCopyUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.embedUrl);
    setCopied(true);
    toast.success("Embed URL copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setResult(null);
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Embed Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {result ? "Embed Ready" : "Create Embed Configuration"}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allowedDomains">Allowed Domains</Label>
              <Input
                id="allowedDomains"
                name="allowedDomains"
                type="text"
                placeholder="example.com, *.mysite.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of domains allowed to embed this property.
                Use *.domain.com for wildcard subdomains.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandingColor">
                Branding Color{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="brandingColor"
                  name="brandingColor"
                  type="text"
                  placeholder="#4a5440"
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showLogo">Show Branding</Label>
                <p className="text-xs text-muted-foreground">
                  Display &ldquo;Powered by Elias Immersive&rdquo; footer
                </p>
              </div>
              <input type="hidden" name="showLogo" value="true" />
              <Switch id="showLogo" defaultChecked />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create Embed Config"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Embed URL + copy */}
            <div className="space-y-2">
              <Label>Embed URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={result.embedUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Embed snippet */}
            <EmbedSnippetDisplay embedUrl={result.embedUrl} />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
