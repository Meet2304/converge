import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  addTimelineItem,
  addTrack,
  resolveReport,
  updateEventToggles,
} from "@/app/actions/org"
import { CopyButton } from "@/components/app/copy-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireUser } from "@/lib/auth/context"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>
}) {
  const { orgId, eventId } = await params
  let user
  try {
    user = await requireUser()
  } catch {
    redirect(`/?login=1&returnTo=/org/${orgId}/events/${eventId}`)
  }

  const db = createAdminClient()
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) notFound()

  const { data: event } = await db.from("events").select("*").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) notFound()

  const { data: tracks } = await db
    .from("event_tracks")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order")
  const { data: timeline } = await db
    .from("event_timeline_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order")
  const { data: reports } = await db
    .from("reports")
    .select("*, target:participations!reports_target_participation_id_fkey(nickname)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(50)

  const origin = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const shareUrl = `${origin}/event/${event.share_code}`

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Manage event</p>
          <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href={`/org/${orgId}`} />}>
          Back
        </Button>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Share</CardTitle>
          <CardDescription>Link + copy + code in one panel.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-white/5 px-2 py-1 text-sm">{shareUrl}</code>
            <CopyButton value={shareUrl} label="Copy link" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Code</span>
            <code className="rounded bg-white/5 px-2 py-1 text-lg font-semibold tracking-widest">
              {event.share_code}
            </code>
            <CopyButton value={event.share_code} label="Copy code" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Toggles</CardTitle>
          <CardDescription>Looking window, map, chat, tracks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateEventToggles} className="grid gap-3">
            <input type="hidden" name="eventId" value={eventId} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="mapEnabled" defaultChecked={event.map_enabled} />
              Map enabled (day-of)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="chatEnabled" defaultChecked={event.chat_enabled} />
              Chat enabled
            </label>
            <div className="grid gap-1.5">
              <Label htmlFor="lookingOpensAt">Looking opens at</Label>
              <Input
                id="lookingOpensAt"
                name="lookingOpensAt"
                type="datetime-local"
                defaultValue={new Date(event.looking_opens_at).toISOString().slice(0, 16)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="mapCenterLat">Map center lat</Label>
                <Input id="mapCenterLat" name="mapCenterLat" defaultValue={event.map_center_lat ?? 37.7749} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mapCenterLng">Map center lng</Label>
                <Input id="mapCenterLng" name="mapCenterLng" defaultValue={event.map_center_lng ?? -122.4194} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="geofenceRadiusM">Geofence warn (m)</Label>
                <Input id="geofenceRadiusM" name="geofenceRadiusM" defaultValue={event.geofence_radius_m ?? 500} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="geofenceHideRadiusM">Geofence hide (m)</Label>
                <Input id="geofenceHideRadiusM" name="geofenceHideRadiusM" defaultValue={event.geofence_hide_radius_m ?? 800} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save toggles</Button>
              <Button type="submit" name="publishTracks" value="true" variant="secondary">
                Publish tracks
              </Button>
              <Button type="submit" name="lockTracks" value="true" variant="secondary">
                Lock track selection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle>Tracks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ul className="space-y-1 text-sm">
              {(tracks ?? []).map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
            <form action={addTrack} className="flex gap-2">
              <input type="hidden" name="eventId" value={eventId} />
              <Input name="name" placeholder="Track name" required />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ul className="space-y-1 text-sm">
              {(timeline ?? []).map((t) => (
                <li key={t.id}>
                  {t.label} · {new Date(t.occurs_at).toLocaleString()}
                </li>
              ))}
            </ul>
            <form action={addTimelineItem} className="grid gap-2">
              <input type="hidden" name="eventId" value={eventId} />
              <Input name="label" placeholder="Label" required />
              <Input name="occursAt" type="datetime-local" required />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Report queue</CardTitle>
          <CardDescription>Warn / suspend / ban via moderation_status on users.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {(reports ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            (reports ?? []).map((r) => (
              <div key={r.id} className="rounded border border-white/10 p-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">{r.context}</span> · {r.status} ·{" "}
                  {(r.target as { nickname?: string } | null)?.nickname || "target"}
                </p>
                {r.body ? <p className="mt-1 text-sm">{r.body}</p> : null}
                <form action={resolveReport} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="reportId" value={r.id} />
                  <select name="status" defaultValue="resolved" className="h-8 rounded border border-input bg-background px-2 text-sm">
                    <option value="reviewing">reviewing</option>
                    <option value="resolved">resolved</option>
                    <option value="dismissed">dismissed</option>
                  </select>
                  <select name="moderationStatus" defaultValue="" className="h-8 rounded border border-input bg-background px-2 text-sm">
                    <option value="">no user action</option>
                    <option value="warned">warn</option>
                    <option value="suspended">suspend</option>
                    <option value="banned">ban</option>
                  </select>
                  <Button type="submit" size="sm">
                    Apply
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  )
}
