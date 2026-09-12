# Converge — Snappiness risk register (pre-build)

**Status:** Snappiness mitigations **fully locked** (2026-09-12). Ready for schema deliberation next (still no app build until you say go).  
**Goal:** Entire site feels highly responsive (perceived & actual).  
**Stack baseline:** [stack.md](stack.md) · product gates: [auth.md](auth.md), [day-of.md](day-of.md), [pre-hackathon.md](pre-hackathon.md)

**Severity:** P0 = will feel slow by default if ignored · P1 = likely under load / mobile · P2 = polish / edge

---

## Locked snappiness decisions (2026-09-12)

| # | Decision | Locked |
|---|----------|--------|
| P1 | Performance budgets (§3) | **Yes** — MVP bar |
| P2 | Optimistic UI for like / chat / looking / team actions | **Yes** — default; rollback on error |
| P3 | Google Maps JS load scope | **Only day-of map + Find** — not on general event browse / marketing |
| P4 | UI kit everywhere practical | **shadcn/ui** for chat, dashboards, forms, sheets, dialogs, etc. (Animate UI + Morphicons for motion/icons) |
| P5 | Grok / resume vs Join speed | **Yes** — Join completes immediately after min profile; Grok nickname/avatar + resume suggestions run **async** in background |
| P6 | Realtime channel split | **Yes** — separate pipes (presence/map, looking, chat/DM, team); subscribe only to what the screen needs |
| P7 | Event home bootstrap | **Yes** — one combined “starter pack” payload (event + first looking cards + viewer status) instead of many sequential fetches |

---

## 1. Summary verdict

The stack (**Next.js + Vercel + Supabase + Auth0 + Google Maps**) can feel snappy. It will **not** feel snappy automatically. Most pain comes from **request waterfalls**, **wrong Realtime primitive**, **Maps JS weight**, **Auth0↔Supabase session bridging**, and **blocking Join on slow AI/uploads** — not from “Supabase can’t do realtime.”

---

## 2. Risk table

| ID | Problem | Why it hurts UX | Sev | Proposed mitigation (to lock) |
|----|---------|-----------------|-----|-------------------------------|
| R1 | **Auth0 → Supabase session waterfall** | First paint waits: Auth0 SDK → token → Supabase client → first query. Feels dead on entry. | P0 | Parallelize; cache JWT for Supabase; show **shell UI immediately**; never block event page on Auth0 for signed-out browse |
| R2 | **Progressive-access data waterfalls** | Event → looking list → profiles → likes sequential. Mobile looks “loading forever.” | P0 | Single **event bootstrap** query/RPC returning page payload; **optimistic/skeleton** UI; prefetch on link hover where safe |
| R3 | **Google Maps JS bundle + tiles** | Day-of map-first loads a heavy third-party script; slow 3G = blank map. | P0 | Lazy-load Maps only on day-of / Find; static event pages **zero Maps**; skeleton map chrome; region-biased tile load; consider `loading=async` + preconnect |
| R4 | **GPS pings via Postgres Changes** | If locations written to DB every tick, WAL latency + write load → laggy pins. | P0 | Already lean-locked: **Broadcast for live GPS**; sparse DB upsert — enforce in schema/API design |
| R5 | **One giant Realtime channel per event** | All presence/chat/likes on one channel → fanout noise, battery, jank. | P0 | Channel topology: `event:{id}:presence`, `event:{id}:looking`, `dm:{id}`, `team:{id}` — subscribe only to what the screen needs |
| R6 | **Chat on every keystroke / naive refetch** | Full list reload or heavy Postgres Changes fanout makes chat feel sticky. | P1 | Optimistic send; append-only; paginate history; Realtime for new messages only; index `(thread_id, created_at)` |
| R7 | **Looking list unbounded `.select('*')`** | 500+ participants → huge JSON, slow first paint, scroll jank. | P0 | Cursor pagination; compact card DTO (no resume blobs); virtualized list; default “looking=true” indexed query |
| R8 | **RLS that does deep joins per row** | Complex policies = slow queries under load; UI waits. | P1 | Denormalize read models where needed; keep RLS simple; security-definer RPCs for hot paths; **indexes first-class in schema** |
| R9 | **Grok nickname/avatar on critical path** | Join blocked on external AI → 2–10s dead time. | P0 | Join with **instant local placeholder**; Grok async; swap when ready (product already allows editable nickname) |
| R10 | **Resume parse blocks Join** | Upload + agent = multi-second stall. | P0 | Already product-locked optional — enforce **never gate Join**; background job + “review suggestions” sheet |
| R11 | **Auth0 + anon merge races** | Like/location before login then merge feels broken/slow/duplicate. | P1 | Explicit merge protocol; idempotent IDs; local optimistic state reconciled once; loading only on merge conflict |
| R12 | **Vercel serverless cold starts** | Occasional 300–1500ms on rare API routes. | P1 | Prefer Supabase client **from browser** for CRUD/Realtime; keep Next API thin; edge where it helps; warm critical paths |
| R13 | **Google Routes on every target move** | Latency + cost + UI thrash. | P1 | Routes only outdoors + debounce (e.g. target moved &gt;25–40m); default guidance = bearing line + warmer/colder |
| R14 | **Mobile Safari background / geolocation** | Tabs throttle timers; pins freeze; user thinks app is broken. | P1 | `visibilitychange` resync; Presence re-track; show “location paused” chip; no silent staleness |
| R15 | **Animation / icon libraries overused** | Morphicons + Animate UI everywhere → main-thread jank on low-end Androids. | P2 | Motion budget: animate **state changes** only; `prefers-reduced-motion`; no map-marker morph spam |
| R16 | **No performance budgets** | Team ships “works on wifi laptop” then day-of dies on venue LTE. | P0 | Lock budgets before build (see §3) |
| R17 | **Third-party script tax** | Auth0 + Maps (+ maybe analytics) compete with interaction. | P1 | Strict script allowlist; defer non-critical; no Maps on pre-event browse |
| R18 | **Optimistic UI not specified** | Like / join team / send message wait for round-trip → feels laggy even at 100ms. | P0 | Lock: **optimistic by default** for like, match ceremony start, chat send, looking toggle; rollback on error toast |
| R19 | **Image/avatar weight** | Grok Imagine / uploads uncompressed → LCP kills. | P1 | Supabase image transforms / fixed sizes; lazy avatars below fold |
| R20 | **Geo privacy checks on every Broadcast** | Server round-trip auth per ping = death. | P0 | Authorize **on channel join**; cache policy; client enforces geofence UI; server validates join + sparse persist |

---

## 3. Performance budgets — **LOCKED**

| Metric | Budget (mobile, mid-tier, LTE) |
|--------|--------------------------------|
| Event page interactive (signed-out browse) | **&lt; 2.0s** LCP-ish / usable |
| Looking list first 20 cards | **&lt; 500ms** after navigation (warm) / **&lt; 1.5s** cold |
| Like → UI feedback | **&lt; 50ms** optimistic |
| Chat send → appears in thread | **&lt; 50ms** optimistic; peer receive **&lt; 300ms** p95 |
| Map first interactive (day-of, Maps loaded) | **&lt; 3.0s** cold including Maps JS |
| Finder peer position update | **&lt; 200ms** p95 after Broadcast send (same region) |
| Join min-profile submit → on looking list | **&lt; 1.0s** (no AI wait) |

---

## 4. Architecture patterns

### Locked
1. **Shell-first rendering** — layout + event chrome before data.  
2. **Optimistic mutations** — likes, chat, looking, team invite accept (P2).  
3. **Maps isolation** — Maps JS only on day-of + Find (P3).  
4. **Broadcast for GPS** — not DB-per-ping (stack.md).  
5. **shadcn/ui first** — chat, org dashboard, forms, dialogs, sheets, data tables as far as practical (P4).  
6. **Indexed, paginated reads** — no unbounded lists in MVP queries.  
7. **Client-owned live path** — browser ↔ Supabase Realtime for presence/chat hot path; Next.js not in the middle of every ping.  
8. **AI off Join critical path** — Grok nickname/avatar + resume parse async after Join (P5).  
9. **Split Realtime channels** — `event:{id}:presence`, `event:{id}:looking`, `dm:{id}`, `team:{id}`; subscribe per screen (P6).  
10. **Event bootstrap RPC** — one starter-pack payload for event home (P7).

---

## 5. What is *not* a problem (at MVP scale)

- Supabase Broadcast capacity for a single hackathon’s live map  
- Vercel hosting for Next.js pages (if we avoid putting hot realtime through serverless)  
- shadcn/Tailwind themselves (unless we bloat JS)

---

## 6. Open snappiness questions
None — P1–P7 locked.

---

## 7. Next

Mitigations folded into [stack.md](stack.md) + [AGENTS.md](../AGENTS.md). Proceed to **schema** deliberation (indexes/read-models for these budgets) when you want — still **no app UI build** until you say go.
