"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

export function DevLoginButton({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function login() {
    start(async () => {
      setError(null)
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "dev@converge.local",
          displayName: "Dev Organizer",
          redirectTo: redirectTo || params.get("returnTo") || "/org",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }
      router.push(data.redirectTo || "/org")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={login} disabled={pending}>
        {pending ? "Signing in…" : "Dev sign-in"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
