"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/auth/paths";

export function LoginForm({
  returnTo,
  googleEnabled,
}: {
  returnTo?: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = safeReturnTo(returnTo || params.get("returnTo"), "/org");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "organizer@converge.local").trim();
    const displayName = String(data.get("displayName") || "Organizer").trim();

    start(async () => {
      setError(null);
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, displayName, redirectTo: next }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) {
        setError(payload.error || "Sign-in failed");
        return;
      }
      router.push(payload.redirectTo || next);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {googleEnabled ? (
        <Button
          nativeButton={false}
          render={<a href={`/api/auth/login?returnTo=${encodeURIComponent(next)}`} />}
        >
          Continue with Google
        </Button>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" defaultValue="Organizer" autoComplete="name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue="organizer@converge.local"
            autoComplete="email"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Signing in…" : "Continue"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!googleEnabled ? (
          <p className="text-xs text-muted-foreground">
            Auth0 Google is not configured, so this demo sign-in creates your organizer session.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Or continue without Google for a local demo.
          </p>
        )}
      </form>
    </div>
  );
}
