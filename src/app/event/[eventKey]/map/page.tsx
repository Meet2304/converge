import Link from "next/link"
import { notFound } from "next/navigation"
import { MapCanvas } from "@/components/day-of/map-canvas"
import { Button } from "@/components/ui/button"
import { getRequestContext } from "@/lib/auth/context"
import { getEventByKey, getMyParticipation } from "@/lib/db/events"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function MapPage({
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

  if (!mine) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">Map</h1>
        <p className="text-muted-foreground">Join the event before sharing location.</p>
        <Button nativeButton={false} render={<Link href={`/event/${event.share_code}/join`} />}>
          Join first
        </Button>
      </main>
    )
  }

  const db = createAdminClient()
  const { data: peers } = await db
    .from("location_state")
    .select("participation_id, last_lat, last_lng, want_to_be_found, sharing_enabled, participations!inner(nickname, current_team_id, event_id)")
    .eq("sharing_enabled", true)
    .eq("want_to_be_found", true)
    .not("last_lat", "is", null)

  const initialPeers = (peers ?? [])
    .filter((p) => (p.participations as unknown as { event_id: string }).event_id === event.id)
    .filter((p) => p.participation_id !== mine.id)
    .filter((p) => {
      const teamId = (p.participations as unknown as { current_team_id: string | null }).current_team_id
      if (mine.current_team_id) return teamId === mine.current_team_id
      return true
    })
    .map((p) => ({
      participationId: p.participation_id,
      label: (p.participations as unknown as { nickname: string }).nickname,
      lat: p.last_lat as number,
      lng: p.last_lng as number,
      teamId: (p.participations as unknown as { current_team_id: string | null }).current_team_id,
    }))

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{event.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Map</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}`} />}>
          Event
        </Button>
      </div>
      <MapCanvas
        eventId={event.id}
        shareCode={event.share_code}
        participationId={mine.id}
        teamId={mine.current_team_id}
        mapEnabled={event.map_enabled}
        center={{
          lat: event.map_center_lat ?? 37.7749,
          lng: event.map_center_lng ?? -122.4194,
        }}
        geofenceRadiusM={event.geofence_radius_m}
        geofenceHideRadiusM={event.geofence_hide_radius_m}
        mapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        initialPeers={initialPeers}
      />
    </main>
  )
}
