"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  consentAndEnableSharing,
  dropMeetupPin,
  upsertSparseLocation,
} from "@/app/actions/map"
import { haversineMeters, warmerColder } from "@/lib/geo"
import { createBrowserSupabase } from "@/lib/supabase/browser"

type Peer = {
  participationId: string
  label: string
  lat: number
  lng: number
  teamId?: string | null
}

type Props = {
  eventId: string
  shareCode: string
  participationId: string
  teamId?: string | null
  mapEnabled: boolean
  center: { lat: number; lng: number }
  geofenceRadiusM?: number | null
  geofenceHideRadiusM?: number | null
  mapsKey?: string | null
  initialPeers?: Peer[]
  findTarget?: Peer | null
}

export function MapCanvas(props: Props) {
  const [sharing, setSharing] = useState(false)
  const [wantFound, setWantFound] = useState(true)
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const [peers, setPeers] = useState<Peer[]>(props.initialPeers ?? [])
  const [findTargetId, setFindTargetId] = useState<string | null>(props.findTarget?.participationId ?? null)
  const [prevDist, setPrevDist] = useState<number | null>(null)
  const [hint, setHint] = useState<string>("")
  const [geofenceWarn, setGeofenceWarn] = useState(false)
  const [hiddenOutside, setHiddenOutside] = useState(false)
  const [pending, start] = useTransition()
  const watchRef = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabase>["channel"]> | null>(null)

  const mapsKey = props.mapsKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const findTarget = useMemo(
    () => peers.find((p) => p.participationId === findTargetId) || props.findTarget || null,
    [peers, findTargetId, props.findTarget]
  )

  useEffect(() => {
    if (!sharing) return
    const supabase = createBrowserSupabase()
    const channel = supabase.channel(`presence:${props.eventId}`, {
      config: { broadcast: { self: false } },
    })
    channel
      .on("broadcast", { event: "loc" }, ({ payload }) => {
        const p = payload as Peer
        if (!p?.participationId || p.participationId === props.participationId) return
        // Team-private when teamed: only show teammates
        if (props.teamId && p.teamId && p.teamId !== props.teamId) return
        if (props.teamId && !p.teamId) return
        setPeers((prev) => {
          const rest = prev.filter((x) => x.participationId !== p.participationId)
          return [...rest, p]
        })
      })
      .subscribe()
    channelRef.current = channel
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [sharing, props.eventId, props.participationId, props.teamId])

  useEffect(() => {
    if (!sharing || !me || !findTarget) return
    const d = haversineMeters(me, findTarget)
    setHint(warmerColder(prevDist, d))
    setPrevDist(d)
  }, [me, findTarget]) // eslint-disable-line react-hooks/exhaustive-deps

  function startWatch() {
    if (!navigator.geolocation) {
      setHint("Geolocation unavailable — stub mode")
      const stub = props.center
      setMe(stub)
      void publish(stub)
      return
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMe(next)
        const center = props.center
        if (props.geofenceRadiusM) {
          const d = haversineMeters(next, center)
          setGeofenceWarn(d > props.geofenceRadiusM)
          const hideR = props.geofenceHideRadiusM ?? props.geofenceRadiusM * 1.25
          setHiddenOutside(d > hideR)
        }
        void publish(next)
      },
      () => setHint("Location permission denied"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }

  async function publish(next: { lat: number; lng: number }) {
    if (hiddenOutside) return
    channelRef.current?.send({
      type: "broadcast",
      event: "loc",
      payload: {
        participationId: props.participationId,
        label: "You",
        lat: next.lat,
        lng: next.lng,
        teamId: props.teamId,
      },
    })
    // Sparse DB upsert (not every tick in production — throttle lightly)
    const fd = new FormData()
    fd.set("participationId", props.participationId)
    fd.set("lat", String(next.lat))
    fd.set("lng", String(next.lng))
    try {
      await upsertSparseLocation(fd)
    } catch {
      /* ignore sparse write failures */
    }
  }

  function enableSharing() {
    start(async () => {
      const fd = new FormData()
      fd.set("participationId", props.participationId)
      fd.set("wantToBeFound", wantFound ? "true" : "false")
      await consentAndEnableSharing(fd)
      setSharing(true)
      startWatch()
    })
  }

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  if (!props.mapEnabled) {
    return (
      <div className="rounded-lg border border-white/10 p-6 text-sm text-muted-foreground">
        Map is off for this event. Organizers can enable it from the event dashboard.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!sharing ? (
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 p-4">
          <p className="text-sm text-muted-foreground">
            Join is done — location is optional. Enable sharing to appear on the map.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wantFound}
              onChange={(e) => setWantFound(e.target.checked)}
            />
            Want to be found
          </label>
          <Button type="button" onClick={enableSharing} disabled={pending}>
            {pending ? "Enabling…" : "Share my location"}
          </Button>
        </div>
      ) : null}

      {geofenceWarn ? (
        <p className="text-sm text-amber-400">You are near the edge of the event area.</p>
      ) : null}
      {hiddenOutside ? (
        <p className="text-sm text-destructive">Outside the geofence — your pin is hidden.</p>
      ) : null}

      <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[#050505]">
        {mapsKey ? (
          <p className="absolute left-3 top-3 z-10 text-xs text-muted-foreground">
            Google Maps key present — stub canvas still used for presence/finder in MVP.
          </p>
        ) : (
          <p className="absolute left-3 top-3 z-10 text-xs text-muted-foreground">
            Stub map (no Maps key) — presence + warmer/colder still work.
          </p>
        )}
        <StubPlane
          me={hiddenOutside ? null : me}
          peers={hiddenOutside ? [] : peers}
          center={props.center}
          findTarget={findTarget}
        />
      </div>

      {sharing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Find someone</Label>
            <select
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              value={findTargetId ?? ""}
              onChange={(e) => {
                setFindTargetId(e.target.value || null)
                setPrevDist(null)
              }}
            >
              <option value="">Select a visible peer</option>
              {peers.map((p) => (
                <option key={p.participationId} value={p.participationId}>
                  {p.label}
                </option>
              ))}
            </select>
            {findTarget && me ? (
              <p className="text-sm">
                Distance ~{Math.round(haversineMeters(me, findTarget))}m —{" "}
                <span className="font-medium text-foreground">{hint || "start"}</span>
              </p>
            ) : null}
          </div>
          <form
            className="flex flex-col gap-2"
            action={dropMeetupPin}
          >
            <input type="hidden" name="eventId" value={props.eventId} />
            <input type="hidden" name="lat" value={me?.lat ?? props.center.lat} />
            <input type="hidden" name="lng" value={me?.lng ?? props.center.lng} />
            <Label htmlFor="pin-label">Drop meetup pin</Label>
            <Input id="pin-label" name="label" placeholder="Near registration" />
            <select
              name="visibility"
              defaultValue="team"
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="team">Team</option>
              <option value="self">Self</option>
              <option value="matches">Matches</option>
            </select>
            <Button type="submit" variant="secondary">
              Drop pin
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function StubPlane({
  me,
  peers,
  center,
  findTarget,
}: {
  me: { lat: number; lng: number } | null
  peers: Peer[]
  center: { lat: number; lng: number }
  findTarget: Peer | null
}) {
  const project = (lat: number, lng: number) => {
    const x = 50 + (lng - center.lng) * 800
    const y = 50 - (lat - center.lat) * 800
    return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) }
  }
  return (
    <div className="relative h-[420px] w-full bg-[radial-gradient(circle_at_center,#141414,transparent_60%)]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#222_1px,transparent_1px),linear-gradient(90deg,#222_1px,transparent_1px)] [background-size:40px_40px]" />
      {me ? (
        <Dot {...project(me.lat, me.lng)} color="#f2f2f2" label="You" />
      ) : null}
      {peers.map((p) => (
        <Dot
          key={p.participationId}
          {...project(p.lat, p.lng)}
          color={findTarget?.participationId === p.participationId ? "#4ade80" : "#888"}
          label={p.label}
        />
      ))}
    </div>
  )
}

function Dot({
  x,
  y,
  color,
  label,
}: {
  x: number
  y: number
  color: string
  label: string
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      title={label}
    >
      <div className="size-3 rounded-full" style={{ background: color }} />
    </div>
  )
}
