"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Trash2, Lock, Globe } from "lucide-react";
import { revokeShareLink } from "@/actions/share-links";
import { toast } from "sonner";
import { APP_URL } from "@/lib/constants";

interface ShareLinkData {
  id: string;
  token: string;
  passwordHash: string | null;
  expiresAt: Date;
  maxViews: number | null;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  createdBy: { firstName: string; lastName: string };
}

interface ShareLinkListProps {
  links: ShareLinkData[];
}

export function ShareLinkList({ links }: ShareLinkListProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Globe className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 text-sm font-medium">No share links yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a share link to let others view this property without logging in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <ShareLinkRow key={link.id} link={link} />
      ))}
    </div>
  );
}

function ShareLinkRow({ link }: { link: ShareLinkData }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isExpired = new Date(link.expiresAt) < new Date();
  const isMaxedOut = link.maxViews ? link.accessCount >= link.maxViews : false;
  const url = `${APP_URL}/share/${link.token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke() {
    startTransition(async () => {
      try {
        await revokeShareLink(link.id);
        toast.success("Share link revoked");
      } catch {
        toast.error("Failed to revoke link");
      }
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="space-y-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <code className="truncate text-xs text-muted-foreground">
            ...{link.token.slice(-12)}
          </code>
          {link.passwordHash && (
            <Badge variant="secondary" className="text-[10px]">
              <Lock className="mr-1 h-3 w-3" />
              Protected
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-[10px]">
              Expired
            </Badge>
          )}
          {isMaxedOut && (
            <Badge variant="destructive" className="text-[10px]">
              Max views
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {link.accessCount} view{link.accessCount !== 1 ? "s" : ""}
            {link.maxViews ? ` / ${link.maxViews} max` : ""}
          </span>
          <span>·</span>
          <span>
            Expires{" "}
            {new Date(link.expiresAt).toLocaleDateString()}
          </span>
          <span>·</span>
          <span>
            By {link.createdBy.firstName} {link.createdBy.lastName}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          title="Copy link"
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
          onClick={handleRevoke}
          disabled={isPending}
          title="Revoke link"
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
