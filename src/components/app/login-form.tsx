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
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);
  const next = safeReturnTo(returnTo || params.get("returnTo"), "/org");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const displayName = String(data.get("displayName") || "").trim();

    start(async () => {
      setError(null);
      setCheckEmail(null);
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName, mode, redirectTo: next }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
        needsEmail?: boolean;
        message?: string;
      };
      if (payload.needsEmail) {
        setCheckEmail(email);
        if (payload.error) setError(payload.error);
        return;
      }
      if (!res.ok) {
        setError(payload.error || "Sign-in failed");
        return;
      }
      router.push(payload.redirectTo || next);
      router.refresh();
    });
  }

  function resend() {
    if (!checkEmail) return;
    start(async () => {
      setError(null);
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: checkEmail, mode: "resend", redirectTo: next }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(payload.error || "Could not resend email");
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

      {checkEmail ? (
        <div className="grid gap-2">
          <p className="body-s text-ink-2">
            We sent a confirmation link to <strong>{checkEmail}</strong>. Check spam if you do not
            see it. After you click the link you will be signed in.
          </p>
          <Button type="button" variant="outline" disabled={pending} onClick={resend}>
            {pending ? "Sending…" : "Resend confirmation email"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          {mode === "signup" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                name="displayName"
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@school.edu"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          <Button type="submit" disabled={pending} className="h-11">
            {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="button"
            className="text-muted-foreground text-left text-xs underline-offset-2 hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === "signup" ? "signin" : "signup");
            }}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </form>
      )}
    </div>
  );
}
