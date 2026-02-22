"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface EmbedSnippetDisplayProps {
  embedUrl: string;
}

export function EmbedSnippetDisplay({ embedUrl }: EmbedSnippetDisplayProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
  style="border: 0; border-radius: 8px;"
></iframe>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Embed Snippet</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs font-mono text-muted-foreground">
        {snippet}
      </pre>
    </div>
  );
}
