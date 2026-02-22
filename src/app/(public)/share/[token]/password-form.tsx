"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface SharePasswordFormProps {
  token: string;
}

export function SharePasswordForm({ token }: SharePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    // Navigate to the same page with password as search param
    // The server component will validate it
    const url = `/share/${token}?p=${encodeURIComponent(password)}`;
    router.push(url);
    // If password is wrong, the page will re-render this form
    setError(true);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Password Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This shared property is password-protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter the password"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">
                Incorrect password. Please try again.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={!password}>
            View Property
          </Button>
        </form>
      </div>
    </div>
  );
}
