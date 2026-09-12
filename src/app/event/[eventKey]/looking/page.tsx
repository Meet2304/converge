import Link from "next/link"
import { notFound } from "next/navigation"
import { likeParticipation } from "@/app/actions/social"
import { setLooking } from "@/app/actions/join"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRequestContext } from "@/lib/auth/context"
import { displayLabel } from "@/lib/display"
import { getEventByKey, getMyParticipation } from "@/lib/db/events"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function LookingPage({
  params,
}: {
  params: Promise<{ eventKey: string }>
}) {
  const { eventKey } = await params
  const event = await getEventByKey(eventKey)
  if (!event) notFound()
  const ctx = await getRequestContext()
  const mine = await getMyParticipation(event.id, {
    userId: ctx.user?.id,
    anonSessionId: ctx.anonSessionId,
  })

  const db = createAdminClient()
  const { data: looking } = await db
    .from("participations")
    .select("id, nickname, avatar_url, role, experience, desired_team_size, bio, looking, current_team_id, created_at, teams(name, team_members(participation_id))")
    .eq("event_id", event.id)
    .eq("looking", true)
    .order("created_at", { ascending: false })
    .limit(60)

  const { data: myLikes } = mine
    ? await db
        .from("likes")
        .select("to_participation_id")
        .eq("event_id", event.id)
        .eq("from_participation_id", mine.id)
    : { data: [] as { to_participation_id: string }[] }

  const liked = new Set((myLikes ?? []).map((l) => l.to_participation_id))
  const signedIn = Boolean(ctx.user)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{event.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Looking</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}`} />}>
            Event
          </Button>
          {!mine ? (
            <Button nativeButton={false} render={<Link href={`/event/${event.share_code}/join`} />}>
              Join first
            </Button>
          ) : (
            <form action={setLooking}>
              <input type="hidden" name="participationId" value={mine.id} />
              <input type="hidden" name="looking" value={mine.looking ? "false" : "true"} />
              <Button type="submit" variant="secondary">
                {mine.looking ? "Stop looking" : "Start looking"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {(looking ?? [])
          .filter((p) => p.id !== mine?.id)
          .map((p, index) => {
            const team = p.teams as unknown as
              | { name: string; team_members: { participation_id: string }[] }
              | null
            const needs =
              team && event.max_team_size
                ? Math.max(event.max_team_size - (team.team_members?.length ?? 0), 0)
                : null
            return (
              <Card key={p.id} className="border-white/10">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.avatar_url}
                      alt=""
                      className="size-12 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {displayLabel({
                          signedInViewer: signedIn,
                          nickname: p.nickname,
                          index,
                        })}
                      </CardTitle>
                      <CardDescription>
                        {p.role} · {p.experience} · wants {p.desired_team_size}
                        {needs != null && needs > 0 ? ` · needs ${needs}` : ""}
                      </CardDescription>
                    </div>
                  </div>
                  {mine ? (
                    <form action={likeParticipation}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="toParticipationId" value={p.id} />
                      <Button type="submit" size="sm" disabled={liked.has(p.id)}>
                        {liked.has(p.id) ? "Liked" : "Like"}
                      </Button>
                    </form>
                  ) : null}
                </CardHeader>
                {p.bio && signedIn ? (
                  <CardContent className="text-sm text-muted-foreground">{p.bio}</CardContent>
                ) : null}
              </Card>
            )
          })}
      </div>
    </main>
  )
}
