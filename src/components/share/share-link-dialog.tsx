"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Check, Send } from "lucide-react";
import { createShareLink, emailShareLink } from "@/actions/share-links";
import { toast } from "sonner";

interface ShareLinkDialogProps {
  propertyId: string;
}

export function ShareLinkDialog({ propertyId }: ShareLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    id: string;
    url: string;
    token: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSending, setIsSending] = useState(false);

  function handleCreate(formData: FormData) {
    formData.set("propertyId", propertyId);
    startTransition(async () => {
      try {
        const link = await createShareLink(formData);
        setResult(link);
        toast.success("Share link created");
      } catch {
        toast.error("Failed to create share link");
      }
    });
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleEmail() {
    if (!result || !emailTo) return;
    setIsSending(true);
    try {
      await emailShareLink(result.id, emailTo);
      toast.success(`Link sent to ${emailTo}`);
      setEmailTo("");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setResult(null);
      setCopied(false);
      setEmailTo("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Share Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {result ? "Share Link Ready" : "Create Share Link"}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires in</Label>
              <Select name="expiresInDays" defaultValue="7">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="Leave blank for no password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxViews">
                Max views{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="maxViews"
                name="maxViews"
                type="number"
                min={1}
                placeholder="Unlimited"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Link display + copy */}
            <div className="flex items-center gap-2">
              <Input value={result.url} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Email share */}
            <div className="space-y-2">
              <Label>Send via email</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEmail}
                  disabled={!emailTo || isSending}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
