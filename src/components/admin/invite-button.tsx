"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendInviteAction, resendInvite, revokeInvite } from "@/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, RefreshCw, X, Copy, Check } from "lucide-react";

interface Invite {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export function SendInviteButton({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await sendInviteAction(orgId, email);
      if (result.success && result.token) {
        setInviteLink(`${window.location.origin}/invite/${result.token}`);
        router.refresh();
      } else {
        setError(result.error || "Failed to send invite");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setEmail("");
    setError("");
    setInviteLink("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Mail className="mr-2 h-4 w-4" />
          Send Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invite</DialogTitle>
          <DialogDescription>
            Invite a user to access this customer&apos;s properties.
          </DialogDescription>
        </DialogHeader>
        {inviteLink ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite sent to <strong>{email}</strong>. You can also share this link directly:
            </p>
            <CopyLink link={inviteLink} />
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="customer@example.com"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
      <code className="flex-1 truncate text-xs">{link}</code>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function InviteList({ invites, orgId }: { invites: Invite[]; orgId: string }) {
  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <InviteRow key={invite.id} invite={invite} orgId={orgId} />
      ))}
    </div>
  );
}

function InviteRow({ invite, orgId }: { invite: Invite; orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    await resendInvite(invite.id);
    router.refresh();
    setLoading(false);
  }

  async function handleRevoke() {
    setLoading(true);
    await revokeInvite(invite.id);
    router.refresh();
    setLoading(false);
  }

  const statusColor = {
    PENDING: "default" as const,
    ACCEPTED: "secondary" as const,
    EXPIRED: "secondary" as const,
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium">{invite.email}</p>
          <p className="text-xs text-muted-foreground">
            Sent {new Date(invite.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusColor[invite.status]}>{invite.status}</Badge>
      </div>
      {invite.status === "PENDING" && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleResend}
            disabled={loading}
            title="Resend invite"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleRevoke}
            disabled={loading}
            title="Revoke invite"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
