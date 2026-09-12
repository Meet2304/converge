import Link from "next/link"
import { enterEventCode } from "@/app/actions/join"
import { DevLoginButton } from "@/components/app/dev-login-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getSession } from "@/lib/auth/session"
import { authDevBypassEnabled } from "@/lib/auth/session"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string; returnTo?: string; error?: string }>
}) {
  const sp = await searchParams
  const session = await getSession()

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-6 py-16">
        <section className="max-w-2xl">
          <p className="mb-4 text-sm tracking-[0.25em] text-muted-foreground uppercase">Converge</p>
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            Find your hackathon team
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground text-pretty">
            Enter a code, join looking, like people, match into chat, form a team — then find each
            other on the map day-of.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Enter event code</CardTitle>
              <CardDescription>Jump straight into a public event page.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={enterEventCode} className="flex flex-col gap-3">
                <Input name="code" placeholder="e.g. HACK26" autoComplete="off" required />
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Organize</CardTitle>
              <CardDescription>
                Create an org, publish an event, share link + code.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {session?.user ? (
                <Button nativeButton={false} render={<Link href="/org" />} className="w-full">
                  Open organizer home
                </Button>
              ) : authDevBypassEnabled() ? (
                <>
                  <DevLoginButton redirectTo={sp.returnTo || "/org"} />
                  <p className="text-xs text-muted-foreground">
                    Auth0 not configured — using AUTH_DEV_BYPASS mock Google login.
                  </p>
                </>
              ) : (
                <Button nativeButton={false} render={<Link href="/api/auth/login?returnTo=/org" />} className="w-full">
                  Sign in with Google
                </Button>
              )}
              {sp.error ? (
                <p className="text-sm text-destructive">Auth error: {sp.error}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
