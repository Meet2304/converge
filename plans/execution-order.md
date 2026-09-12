# Converge — execution order

**Goal:** Ship the platform in vertical slices that each prove a real journey, without building day-of or chat before the data/auth foundations exist.  
**SoT:** [AGENTS.md](../AGENTS.md) · [docs/INDEX.md](../docs/INDEX.md) · [docs/stack.md](../docs/stack.md)  
**Now:** UX locked through day-of; stack + snappiness locked; schema **locked and applied** to Supabase `converge`; Next.js skeleton is next.

---

## Principle

Build **thin end-to-end paths**, not all UI then all backend.

Each slice should leave something demoable (link → screen → persisted data → correct privacy). Skip `[D]` (recommendations, native). Stub `[P]` (Grok) behind config.

---

## Phase 0 — Unblock the repo (same week, parallel)

1. Sync full Project docs + stack into Origin **and** GitHub (`Meet2304/converge`).
2. Lock **snappiness / perf mitigations** ([docs/perf-risks.md](../docs/perf-risks.md)) before schema hardens bad patterns.
3. Finish **schema deliberation** (ERD + RLS sketch — still design, little/no UI).
4. Provision empty projects: Vercel, Supabase, Auth0 (Google), Google Maps key — secrets in env, not docs.

**Exit:** One repo SoT, perf guardrails + ERD agreed, accounts ready.

---

## Phase 1 — Skeleton (no product features)

| Order | Build | Why first |
|------|--------|-----------|
| 1.1 | Next.js app (App Router) on Vercel + Tailwind + shadcn/ui | Locked medium/stack |
| 1.2 | Supabase client wiring + migrations pipeline | All domain data lands here |
| 1.3 | Auth0 + Google; session in Next.js; **anon cookie/session** | Progressive access depends on anon→login merge |
| 1.4 | App shell: landing, org mode vs candidate mode routes | One web app, two modes |

**Exit:** Deployed empty app; login works; anon id stable across refresh.

---

## Phase 2 — Schema + core domain (before pretty flows)

Implement Postgres (Supabase) roughly in this **dependency order**:

1. `organizations` → `org_memberships` (owner/admin)
2. `events` (+ timeline, tracks, share slug/code, looking window, map flag)
3. `participations` (user ↔ event; Join profile fields; looking; nickname/avatar stubs)
4. `likes` / `matches` (anon actor id + merge-on-login)
5. `teams` / `team_members` / invites
6. `conversations` / `messages` (1:1 and team)
7. `reports` / moderation flags
8. `location_state` (consent, want-to-be-found, last-known — **not** every GPS tick)
9. `pins` (day-of meetup pins)

RLS from day one for: signed-out anonymized read, signed-in PII, team-private location, org admin scopes ([auth.md](../docs/auth.md), [day-of.md](../docs/day-of.md)).

**Exit:** Migrations + RLS tests (or policy checklist) for the tables above; no need for full UI yet.

---

## Phase 3 — Organizer spine (creates the event universe)

| Order | Slice | Demo |
|------|--------|------|
| 3.1 | Create org + create event (required fields from onboarding) | Org can save an event |
| 3.2 | Share panel: link + copy + **event code** | Code/link resolve to event |
| 3.3 | Org event controls: looking window, track publish, map enable (flags only) | Toggles persist |

**Exit:** A real event URL/code exists without Discord.

---

## Phase 4 — Candidate pre-event MVP (the product core)

Build in journey order:

| Order | Slice | INDEX |
|------|--------|--------|
| 4.1 | Global **Enter code** + public event page (single scroll, signed-out OK) | 5.1, 3.5 |
| 4.2 | **Join** min profile → participation; looking on/off | 4.x |
| 4.3 | Looking list (recent sort) + profile peek with **PII rules** | 5.2, 5.7 |
| 4.4 | Like (anon OK) + merge likes on Auth0 login + in-app “liked you” | 2.11, 5.4–5.6 |
| 4.5 | Mutual → match ceremony → gate **1:1 chat** (signed-in only) | 2.12, 5.8 |
| 4.6 | Teams: create, invite link/code, kick/rename, leave/dissolve, one team/event, group chat | 5.9–5.17 |
| 4.7 | Report → org queue (minimal) | 2.13 |

**Exit:** Full pre-hackathon loop: code → join → like → match → chat → team. **Ship-quality MVP** even before maps.

---

## Phase 5 — Day-of map (only after Join + teams exist)

| Order | Slice | Notes |
|------|--------|--------|
| 5.1 | Org enables map; event opens **map-first** when on | Google Maps JS |
| 5.2 | Join-before-share location; consent + want-to-be-found | auth/day-of gates |
| 5.3 | Live presence via **Realtime Broadcast** (throttled); sparse last-known upsert | stack.md pattern |
| 5.4 | Visibility pools: looking+matches vs **teammates only** when teamed | hard privacy rule |
| 5.5 | Find person (line / warmer-colder; optional walking route outdoors) | maps doc |
| 5.6 | Meetup pins + hybrid geofence (warn + hide) | D5, D7 |
| 5.7 | In-app day-of notifications only | no push/email |

**Exit:** Two phones can find each other under the locked privacy rules.

---

## Phase 6 — Enrichment (after core works)

- Grok nickname + Imagine avatar when creds arrive (replace stubs)
- Optional resume → propose profile fills
- Org moderation UX polish, track publish UX, timeline editor polish
- PWA only if day-of install friction shows up

---

## What not to start with

- Map / Google Maps before Join + RLS privacy  
- Chat before likes/match gates  
- Recommendation/ranking  
- Native app / push email  
- Perfect indoor floor routing  

---

## Suggested “first coding week”

1. Schema pass → migration PR  
2. Next.js + Auth0 + anon session  
3. Org create event + share code  
4. Enter code → event page → Join → looking list  

That sequence yields a usable pre-event surface quickly; chat/teams/map layer on without rework if schema anticipates them.
