"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Trash2, RefreshCw, Code } from "lucide-react";
import { revokeEmbedConfig, regenerateApiKey } from "@/actions/embed-configs";
import { EmbedSnippetDisplay } from "./embed-snippet-display";
import { toast } from "sonner";
import { APP_URL } from "@/lib/constants";

interface EmbedConfigData {
  id: string;
  apiKey: string;
  allowedDomains: string[];
  brandingColor: string | null;
  showLogo: boolean;
  createdAt: Date;
}

interface EmbedConfigListProps {
  configs: EmbedConfigData[];
}

export function EmbedConfigList({ configs }: EmbedConfigListProps) {
  if (configs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Code className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-sm font-medium">No embed configurations</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an embed config to generate an iframe snippet for your website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <EmbedConfigRow key={config.id} config={config} />
      ))}
    </div>
  );
}

function EmbedConfigRow({ config }: { config: EmbedConfigData }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showSnippet, setShowSnippet] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState(config.apiKey);

  const embedUrl = `${APP_URL}/embed/${currentApiKey}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(embedUrl);
    setCopied(true);
    toast.success("Embed URL copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke() {
    startTransition(async () => {
      try {
        await revokeEmbedConfig(config.id);
        toast.success("Embed config revoked");
      } catch {
        toast.error("Failed to revoke config");
      }
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        const result = await regenerateApiKey(config.id);
        setCurrentApiKey(result.apiKey);
        toast.success("API key regenerated — update your embed snippet");
      } catch {
        toast.error("Failed to regenerate API key");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <code className="truncate text-xs text-muted-foreground">
              ...{currentApiKey.slice(-12)}
            </code>
            {config.brandingColor && (
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: config.brandingColor }}
                />
              </div>
            )}
            {!config.showLogo && (
              <Badge variant="secondary" className="text-[10px]">
                No branding
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Domains:{" "}
              {config.allowedDomains.join(", ")}
            </span>
            <span>·</span>
            <span>
              Created{" "}
              {new Date(config.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy embed URL"
            className="h-8 w-8"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRegenerate}
            disabled={isPending}
            title="Regenerate API key"
            className="h-8 w-8"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRevoke}
            disabled={isPending}
            title="Revoke embed config"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Toggle snippet */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSnippet(!showSnippet)}
          className="text-xs"
        >
          <Code className="mr-1.5 h-3 w-3" />
          {showSnippet ? "Hide Snippet" : "Show Embed Snippet"}
        </Button>
      </div>

      {/* Snippet display */}
      {showSnippet && <EmbedSnippetDisplay embedUrl={embedUrl} />}
    </div>
  );
}
