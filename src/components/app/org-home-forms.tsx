"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    redirectTo?: string;
  };
  if (!res.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload;
}

export function CreateDemoEventButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            setError(null);
            try {
              const payload = await postJson("/api/org/demo");
              router.push(payload.redirectTo || "/org");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create demo event");
            }
          });
        }}
      >
        {pending ? "Creating…" : "Create a demo event"}
      </Button>
      {error ? <p className="text-destructive max-w-sm text-sm">{error}</p> : null}
    </div>
  );
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      setError(null);
      try {
        const payload = await postJson("/api/org", {
          name: String(data.get("name") || ""),
          description: String(data.get("description") || ""),
          website: String(data.get("website") || ""),
        });
        router.push(payload.redirectTo || "/org");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create organization");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" placeholder="https://" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create org"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </form>
  );
}
