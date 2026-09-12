import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/context"
import { getEventByKey } from "@/lib/db/events"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ eventKey: string; matchId: string }>
}) {
  const { eventKey, matchId } = await params
  const event = await getEventByKey(eventKey)
  if (!event) notFound()

  let user
  try {
    user = await requireUser()
  } catch {
    redirect(`/?login=1&returnTo=/event/${eventKey}/match/${matchId}`)
  }

  const db = createAdminClient()
  const { data: match } = await db
    .from("matches")
    .select("*, a:participations!matches_participation_a_id_fkey(id, nickname, avatar_url), b:participations!matches_participation_b_id_fkey(id, nickname, avatar_url)")
    .eq("id", matchId)
    .eq("event_id", event.id)
    .maybeSingle()
  if (!match) notFound()

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-sm tracking-[0.2em] text-muted-foreground uppercase">Match</p>
      <h1 className="text-4xl font-semibold tracking-tight">It&apos;s a match</h1>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={(match.a as { avatar_url: string }).avatar_url} alt="" className="size-16 rounded-full" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={(match.b as { avatar_url: string }).avatar_url} alt="" className="size-16 rounded-full" />
      </div>
      <p className="text-muted-foreground">
        {(match.a as { nickname: string }).nickname} · {(match.b as { nickname: string }).nickname}
      </p>
      <Card className="w-full border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Next</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {match.conversation_id ? (
            <Button nativeButton={false} render={<Link href={`/event/${event.share_code}/chat/${match.conversation_id}`} />}>
              Open chat
            </Button>
          ) : null}
          <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}/looking`} />}>
            Back to looking
          </Button>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Signed in as {user.displayName || user.email}</p>
    </main>
  )
}
