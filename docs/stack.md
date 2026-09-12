# Converge — Technical stack

**Status:** Core stack locked; **schema** still deferred. Maps MVP locked to Google + live presence.  
**Already locked elsewhere:** Next.js web, Auth0 + Google login — [medium.md](medium.md), [auth.md](auth.md).

**Research:** [maps-google-p2p-navigation.md](maps-google-p2p-navigation.md)  
**Agents:** [../AGENTS.md](../AGENTS.md) · [INDEX.md](INDEX.md)

---

## Locked decisions

| ID | Layer | Locked |
|----|--------|--------|
| S1 | Database / backend platform | **Supabase** (Postgres + Realtime + Storage) |
| S2 | Hosting | **Vercel** (Next.js) |
| S3 | Maps / P2P navigation (MVP) | **Google Maps JavaScript API** + live shared locations (see below) |
| S4 | File storage | **Supabase Storage** (S3-compatible), coupled to Supabase |
| S8 | UI components | **shadcn/ui** + Tailwind — use for **chat, dashboards, forms, sheets, dialogs, tables**, etc. as far as practical |
| S8a | Animated icons | **Animate UI** |
| S8b | Morphing icons | **Morphicons** — [morphicons.com](https://www.morphicons.com/) |
| S9 | Snappiness | **Fully locked** — budgets, optimistic UI, Maps-only day-of/Find, shadcn-first, async Grok/resume after Join, split Realtime channels, event bootstrap RPC — [perf-risks.md](perf-risks.md) |
| — | App framework | **Next.js** (from medium.md) |
| — | Auth | **Auth0** + Google (from auth.md); **do not** replace with Supabase Auth |

## Explicitly deferred

| Topic | Status |
|--------|--------|
| Full Postgres schema | **Deliberate next** (dedicated schema pass) |
| Indoor venue SDK (MapsIndoors / Mappedin / etc.) | **Out of MVP** — revisit if organizers need true floor routing |
| Native app | Out of MVP (medium.md) |

---

## Working architecture (given locks)

```
[Next.js on Vercel]
  ├─ Auth0 (Google) session
  ├─ Anon session → merge on login
  ├─ shadcn/ui + Animate UI + Morphicons
  ├─ Google Maps JS (basemap, markers, polylines, optional Routes)
  └─ Supabase client
        ├─ Postgres (domain data — schema TBD)
        ├─ Realtime (chat, likes/notifs, **live map presence**)
        └─ Storage (resumes, pin assets, optional floor images later)
[xAI Grok] nickname / Imagine avatar / resume assist (creds pending)
```

**Privacy & presence rules** live in Supabase (RLS + Realtime auth), not only in the UI — especially team-only map (day-of.md).

---

## Realtime speed (live tracking) — locked approach

**Q: Is Supabase fast enough for realtime person tracking if UX/speed is a priority?**  
**A: Yes for Converge MVP** — if we use the right Realtime primitive.

| Primitive | Typical latency | Use for |
|-----------|-----------------|---------|
| **Broadcast** | ~tens of ms (benchmarks: median often **&lt;60ms**; p95 still snappy at large scale) | **Live lat/lng pings** (ephemeral, high frequency) |
| **Presence** | Low tens–&lt;100ms | Who’s on the map / online in the event channel |
| **Postgres Changes** | ~50–400ms+ (goes through DB WAL) | Chat messages, likes, team joins — **not** every GPS tick |

### Why this is fast enough for map UX
- Finder/map pins feel “live” at **~1–2 updates/sec** (or on meaningful movement). Humans don’t need 20Hz GPS for “walk toward this person.”
- At hackathon scale (tens–low thousands concurrent), Broadcast is well within Supabase’s published throughput (hundreds of thousands msgs/sec in benchmarks).
- Bottlenecks that *would* hurt UX: writing every ping to Postgres, then listening via Postgres Changes; unthrottled spam; fat payloads; ignoring reconnect.

### Locked eng pattern (speed-first)
1. **Live path:** client → Supabase **Broadcast** (private event/finder channel) with `{userId, lat, lng, updatedAt, floorHint?}`.  
2. **Throttle:** send on interval **and/or** when moved &gt;N meters (e.g. 1–2 Hz max).  
3. **Persist sparingly:** upsert “last known location” to Postgres every ~30–60s (or on Find start) for cold join / refresh — not per ping.  
4. **Interpolate lightly on client** between pings so markers don’t stutter.  
5. **Escape hatch (not MVP):** add Ably/Pusher/dedicated WS only if measured p95 breaks UX at real events — don’t preemptively split the stack.

Sources: [Supabase Realtime benchmarks](https://supabase.com/docs/guides/realtime/benchmarks); Broadcast vs Postgres Changes guidance in Supabase docs / production writeups.

---

## S3 — MVP person-to-person navigation (locked)

**Q: Can we navigate from one person to another using Google Maps + live shared locations?**  
**A: Yes** for MVP, with this split of responsibility:

| Piece | Who does it |
|--------|-------------|
| Continuously share my lat/lng (after Join + consent + privacy rules) | **Supabase Realtime Broadcast** (throttled); Presence for “who’s live”; sparse Postgres upsert for last-known |
| Show me + target on a map | **Google Maps JS** markers |
| Guide me toward them | **Google overlay** (line / camera follow) + locked **warmer/colder** finder; optional **Routes API WALKING** when both points look outdoor |
| Floor-perfect indoor corridors | **Not MVP** (Google can’t do this for arbitrary venues) |

### Live P2P flow
1. User A and User B both Joined and opted into location (and B “want to be found” / team rules as applicable).  
2. Clients **Broadcast** `{lat, lng, updatedAt, …}` on a throttled interval (not a DB write per tick).  
3. A opens **Find** on B → map centers on A, marker on B’s latest point, updates as B moves.  
4. Guidance = distance + bearing + warmer/colder; outdoors may request a walking route to B’s **current** pin and refresh occasionally (debounced to control cost).

This is **live destination = moving person**, not a fixed address — fully possible because we own the coordinate stream and Google only renders/routes to the latest point.

### MVP non-goals (maps)
- Multi-floor Google indoor routing  
- Native Navigation SDK  
- Guaranteed sub-meter indoor accuracy  

---

## Open questions

1. Schema deliberation kickoff — org → event → participation → team → chat → presence?  
2. Outdoor Routes refresh policy (e.g. re-route only if target moved >N meters) — eng detail, can wait until build  
3. DIY floor-plan image overlays in v1.1? (optional later)

---

## Snappiness — **fully locked**

See [perf-risks.md](perf-risks.md): performance budgets; optimistic UI; Maps JS only on day-of + Find; shadcn-first; Join never waits on Grok/resume; split Realtime channels; event home bootstrap RPC.

---

## Non-goals for this doc

- Implementing code or provisioning projects  
- Final ERD (separate schema session)
