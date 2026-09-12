import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRequestContext } from "@/lib/auth/context"
import { getEventByKey, getMyParticipation } from "@/lib/db/events"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function EventPublicPage({
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
  const { data: timeline } = await db
    .from("event_timeline_items")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order")
  const { data: tracks } = await db
    .from("event_tracks")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order")

  const tracksVisible = Boolean(event.tracks_published_at)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-sm text-muted-foreground">
          {(event.organizations as { name?: string } | null)?.name || "Event"}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{event.name}</h1>
        <p className="mt-3 text-muted-foreground">{event.short_description}</p>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            {event.venue_name}
            {event.venue_address ? ` · ${event.venue_address}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {new Date(event.starts_at).toLocaleString()} → {new Date(event.ends_at).toLocaleString()} ({event.timezone})
          </p>
          <p>Team size {event.min_team_size}–{event.max_team_size}</p>
          <p>Looking opens {new Date(event.looking_opens_at).toLocaleString()}</p>
          {event.long_description ? <p className="whitespace-pre-wrap text-foreground">{event.long_description}</p> : null}
        </CardContent>
      </Card>

      {(timeline ?? []).length ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">Timeline</h2>
          <ul className="space-y-2 text-sm">
            {(timeline ?? []).map((t) => (
              <li key={t.id} className="flex justify-between gap-4 border-b border-white/5 py-2">
                <span>{t.label}</span>
                <span className="text-muted-foreground">{new Date(t.occurs_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tracksVisible ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">Tracks</h2>
          <div className="flex flex-wrap gap-2">
            {(tracks ?? []).map((t) => (
              <span key={t.id} className="rounded-full border border-white/15 px-3 py-1 text-sm">
                {t.name}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Tracks not published yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link href={`/event/${event.share_code}/join`} />}>
          {mine ? "Edit Join profile" : "Join"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}/looking`} />}>
          Looking
        </Button>
        {event.map_enabled ? (
          <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}/map`} />}>
            Map
          </Button>
        ) : null}
        {mine?.current_team_id ? (
          <Button variant="secondary" nativeButton={false} render={<Link href={`/event/${event.share_code}/team/${mine.current_team_id}`} />}>
            My team
          </Button>
        ) : null}
      </div>
    </main>
  )
}
