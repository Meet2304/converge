# Converge — Agent-ready build order

**Purpose:** Spawn implementer agents with clear deps, done-when, and hard out-of-scope.  
**Audience:** Meet (orchestrator) + coding agents.  
**SoT (do not contradict):** [AGENTS.md](../AGENTS.md) · [INDEX.md](INDEX.md) · [stack.md](stack.md) · [perf-risks.md](perf-risks.md) · [plans/execution-order.md](../plans/execution-order.md)  
**Also respect:** [auth.md](auth.md), [onboarding.md](onboarding.md), [pre-hackathon.md](pre-hackathon.md), [day-of.md](day-of.md), [schema-priorities.md](schema-priorities.md) (when locked)

**Rule:** Foundations before map. Skeleton → schema/RLS → org spine → pre-event MVP → day-of → enrichment. Skip `[D]`. Stub `[P]` (Grok).

---

## Why this order first

1. **Progressive access + privacy are load-bearing** — anon browse, Auth0 merge, RLS, and team-private location must exist before map/chat or we rework everything.  
2. **Events must exist before candidates** — org spine creates the shareable universe (link/code).  
3. **Pre-event loop is the shippable MVP** — code → Join → looking → like → match → chat → team is valuable without maps.  
4. **Day-of map depends on Join + teams + Broadcast pattern** — building Maps first locks in wrong privacy and DB-per-ping mistakes ([perf-risks.md](perf-risks.md), [stack.md](stack.md)).  
5. **Snappiness is a constraint, not a polish pass** — bootstrap RPC, optimistic UI, Maps-only-on-day-of/Find, split Realtime channels are required from the slices that touch them.

---

## Phased dependency graph

```
Phase 0  Unblock (docs sync, env accounts, schema design lock)
    ↓
Phase 1  Skeleton (Next.js + Supabase wiring + Auth0/anon + shell routes)
    ↓
Phase 2  Schema + RLS (org→event→participation→likes→teams→chat→reports→location_state→pins)
    ↓
Phase 3  Org spine (create org/event → share → org toggles)
    ↓
Phase 4  Pre-event MVP (enter code → Join → looking → like/match → chat → teams → report)
    ↓
Phase 5  Day-of (map enable → consent → Broadcast presence → visibility pools → Find → pins → geofence)
    ↓
Phase 6  Enrichment (Grok stubs→live, resume assist, polish, optional PWA)
```

**Hard edges:**  
- No Phase 5 without Phase 2 location_state + Phase 4 Join/teams.  
- No chat UI without likes/match gates (auth).  
- No Grok on Join critical path (perf P5).

---

## Do not start with

| Anti-pattern | Why |
|--------------|-----|
| Google Maps / Find UX | Needs Join, RLS, teams, Broadcast topology first |
| Full chat product | Needs match gate + conversation schema |
| Recommendation / ranking | `[D]` — INDEX 0.4 |
| Native app / push / email | Deferred; in-app only |
| Indoor floor SDKs | Out of MVP (stack) |
| Writing every GPS ping to Postgres | Violates stack/perf locks |
| Loading Maps JS on general event browse | Violates perf P3 |
| Blocking Join on Grok/resume | Violates perf P5 |
| One mega Realtime channel for all event traffic | Violates perf P6 |
| Unbounded `.select('*')` looking lists | Violates perf budgets |

---

## Agent task cards

### Phase 0 — Unblock

#### B0.1 — Sync SoT docs into repos
- **Done when:** Origin + GitHub contain AGENTS.md, docs/* (vision, INDEX, stack, perf-risks, auth, …), plans/execution-order.md; links resolve on checkout.  
- **Depends on:** —  
- **Parallel with:** B0.2, B0.4  
- **Touches:** repo docs only (no app feature code required).  
- **Out of scope:** Implementing product UI; inventing new product rules.

#### B0.2 — Confirm snappiness constraints in repo README/AGENTS
- **Done when:** Agents reading repo see perf budgets, optimistic UI, Maps scope, Broadcast GPS, bootstrap RPC, split channels as hard constraints.  
- **Depends on:** B0.1 (or same PR).  
- **Parallel with:** B0.3, B0.4  
- **Touches:** AGENTS.md, docs/perf-risks.md, docs/stack.md.  
- **Out of scope:** Measuring production latency yet.

#### B0.3 — Schema priorities → ERD + RLS sketch
- **Done when:** Locked schema-priorities + ERD doc listing tables (org→pins order from execution-order), RLS checklist for signed-out / signed-in / team / org admin; no unbounded list designs.  
- **Depends on:** schema-priorities lock with Meet.  
- **Parallel with:** B0.4  
- **Touches:** docs/schema-priorities.md, docs/schema.md (new), notes.  
- **Out of scope:** Shipping migrations without Meet approval; app UI.

#### B0.4 — Provision empty cloud projects
- **Done when:** Vercel, Supabase, Auth0 (Google), Google Maps key exist; env var names documented; secrets not committed.  
- **Depends on:** —  
- **Parallel with:** B0.1–B0.3  
- **Touches:** .env.example only.  
- **Out of scope:** Production hardening; custom domains.

---

### Phase 1 — Skeleton

#### B1.1 — Next.js App Router + Tailwind + shadcn on Vercel
- **Done when:** Deployed hello app; shadcn initialized; Animate UI / Morphicons installable pattern documented.  
- **Depends on:** B0.4 (Vercel).  
- **Parallel with:** B1.2 (after repo exists).  
- **Touches:** app scaffold, package.json, Vercel project.  
- **Out of scope:** Product pages beyond placeholders; Maps.

#### B1.2 — Supabase client + migrations pipeline
- **Done when:** Local/CI can run migrations; browser + server Supabase clients exist; no domain tables required yet (empty or health migration OK).  
- **Depends on:** B0.4 (Supabase), B1.1.  
- **Parallel with:** B1.3  
- **Touches:** supabase/, lib/supabase*.  
- **Out of scope:** Full ERD implementation (that’s Phase 2).

#### B1.3 — Auth0 Google + Next session + stable anon id
- **Done when:** Google login works; signed-out browse possible; anon cookie/id survives refresh; merge hook stubbed (idempotent) for later likes.  
- **Depends on:** B0.4 (Auth0), B1.1.  
- **Parallel with:** B1.2  
- **Touches:** auth routes, middleware, anon session util.  
- **Out of scope:** Replacing Auth0 with Supabase Auth; full like merge UI.

#### B1.4 — App shell routes (landing, org mode, candidate mode)
- **Done when:** Route groups exist for org vs candidate; landing has Enter code placeholder; shadcn shell layout.  
- **Depends on:** B1.1.  
- **Parallel with:** B1.2, B1.3  
- **Touches:** app/(marketing), app/(org), app/(event) structure.  
- **Out of scope:** Real event CRUD; map routes.

**Phase 1 exit:** Deployed empty app; login works; anon id stable.

---

### Phase 2 — Schema + RLS

#### B2.1 — Core tenancy tables + RLS
- **Done when:** Migrations for `organizations`, `org_memberships`, `events` (+ timeline/tracks/share code/looking window/map flag columns or related tables per ERD); RLS for org admin vs public event read.  
- **Depends on:** B0.3, B1.2.  
- **Parallel with:** — (blocks B2.2).  
- **Touches:** supabase/migrations.  
- **Out of scope:** UI; location Broadcast.

#### B2.2 — Participations + profile fields
- **Done when:** `participations` (user↔event, Join fields, looking, nickname/avatar stubs); one participation per user per event enforced; indexes for looking list.  
- **Depends on:** B2.1.  
- **Parallel with:** —  
- **Touches:** migrations, optional seed.  
- **Out of scope:** Grok generation (stub columns only).

#### B2.3 — Likes / matches + anon actor merge columns
- **Done when:** likes/matches tables support anon actor id + Auth0 user id; unique constraints; merge path documented/tested at SQL level.  
- **Depends on:** B2.2.  
- **Parallel with:** B2.4  
- **Touches:** migrations.  
- **Out of scope:** Match ceremony UI.

#### B2.4 — Teams + members + invites
- **Done when:** teams/team_members/invites; max team size checkable; one team per participation per event enforceable.  
- **Depends on:** B2.2.  
- **Parallel with:** B2.3  
- **Touches:** migrations.  
- **Out of scope:** Team UI.

#### B2.5 — Conversations / messages
- **Done when:** 1:1 and team conversation models; index `(thread_id, created_at)`; RLS chat only signed-in + membership.  
- **Depends on:** B2.3 (for 1:1 gate readiness), B2.4 (team chat).  
- **Parallel with:** B2.6  
- **Touches:** migrations.  
- **Out of scope:** Chat UI; typing indicators.

#### B2.6 — Reports + location_state + pins
- **Done when:** reports table; `location_state` (consent, want-to-be-found, last-known — not tick stream); pins table; RLS sketches for team-private location.  
- **Depends on:** B2.2; B2.4 for team-private rules.  
- **Parallel with:** B2.5  
- **Touches:** migrations.  
- **Out of scope:** Live Broadcast implementation; Maps UI.

#### B2.7 — Bootstrap RPC + looking card DTO
- **Done when:** One RPC/view returns event home starter pack (event + first looking cards + viewer status) matching perf P7; no resume blobs in card DTO.  
- **Depends on:** B2.1–B2.2.  
- **Parallel with:** B2.3–B2.6 once B2.2 exists.  
- **Touches:** SQL functions/views.  
- **Out of scope:** Client UI wiring (Phase 4).

**Phase 2 exit:** Migrations + RLS checklist/tests for tables above.

---

### Phase 3 — Organizer spine

#### B3.1 — Create org + create event
- **Done when:** Signed-in user creates org + event with required onboarding fields (max team size, ≥1 track, etc.); persisted.  
- **Depends on:** B1.3, B2.1.  
- **Parallel with:** —  
- **Touches:** org UI (shadcn forms), server actions.  
- **Out of scope:** Candidate Join; Maps.

#### B3.2 — Share panel (link + copy + event code)
- **Done when:** Share UI works; code/link resolves to event.  
- **Depends on:** B3.1.  
- **Parallel with:** B3.3  
- **Touches:** share components.  
- **Out of scope:** Global Enter code page (B4.1 can share resolver).

#### B3.3 — Org controls (looking window, track publish, map flag)
- **Done when:** Toggles persist; map flag does not load Maps JS by itself.  
- **Depends on:** B3.1.  
- **Parallel with:** B3.2  
- **Touches:** org event settings.  
- **Out of scope:** Day-of map rendering.

**Phase 3 exit:** Real event URL/code without Discord.

---

### Phase 4 — Pre-event MVP

#### B4.1 — Enter code + public event page (single scroll)
- **Done when:** Global Enter code; signed-out can view event; uses bootstrap RPC; **no Maps JS**.  
- **Depends on:** B2.7, B3.2.  
- **Parallel with:** —  
- **Touches:** landing + event page.  
- **Out of scope:** Map-first layout.

#### B4.2 — Join min profile → participation
- **Done when:** Join form (~60–90s fields); looking on/off; Join &lt;1s path without waiting on Grok/resume; placeholders OK.  
- **Depends on:** B4.1, B2.2, B1.3.  
- **Parallel with:** —  
- **Touches:** Join UI, participation insert.  
- **Out of scope:** Live Grok (stub async job OK).

#### B4.3 — Looking list + profile peek (PII rules)
- **Done when:** Recent sort; paginated; signed-out anonymized; signed-in names/socials per auth; virtualized/compact cards.  
- **Depends on:** B4.2, B2.7.  
- **Parallel with:** B4.7 (report can start early).  
- **Touches:** looking list UI.  
- **Out of scope:** Recommendations.

#### B4.4 — Like + anon merge + in-app “liked you”
- **Done when:** Like works signed-out; merges on Auth0 login; optimistic UI; in-app notif only.  
- **Depends on:** B4.3, B2.3, B1.3.  
- **Parallel with:** —  
- **Touches:** like actions, merge job.  
- **Out of scope:** Email/push.

#### B4.5 — Mutual match → 1:1 chat gate
- **Done when:** Match ceremony UI; chat only after Auth0 + match rules; optimistic send; Realtime on `dm:{id}` channel only.  
- **Depends on:** B4.4, B2.5.  
- **Parallel with:** —  
- **Touches:** match UI, chat UI (shadcn).  
- **Out of scope:** Global #looking chat.

#### B4.6 — Teams + group chat
- **Done when:** Create/invite/kick/rename/leave/dissolve; one team/event; group chat on `team:{id}`; max size enforced.  
- **Depends on:** B4.2, B2.4, B2.5.  
- **Parallel with:** B4.5 (after B4.2).  
- **Touches:** team UI, team chat.  
- **Out of scope:** Map teammate finder.

#### B4.7 — Report → org queue (minimal)
- **Done when:** Report from profile/chat; appears in org queue; ladder fields stubbed.  
- **Depends on:** B2.6, B4.1.  
- **Parallel with:** B4.3–B4.6  
- **Touches:** report dialog, org moderation list.  
- **Out of scope:** Screenshot upload requirement.

**Phase 4 exit:** Full pre-hackathon loop demoable end-to-end.

---

### Phase 5 — Day-of map

#### B5.1 — Map-first when org enables map
- **Done when:** Flag on → event opens map-first; Maps JS loaded only here + Find; skeleton while loading.  
- **Depends on:** B3.3, B4.2, Phase 4 privacy paths stable.  
- **Parallel with:** —  
- **Touches:** day-of map route, Google Maps loader.  
- **Out of scope:** Indoor SDKs.

#### B5.2 — Join-before-share + consent + want-to-be-found
- **Done when:** Cannot share location without Join; consent + want-to-be-found persisted in location_state.  
- **Depends on:** B5.1, B2.6.  
- **Parallel with:** —  
- **Touches:** consent UI.  
- **Out of scope:** Background tracking when tab hidden without paused chip.

#### B5.3 — Live presence Broadcast + sparse last-known
- **Done when:** Throttled Broadcast on `event:{id}:presence`; sparse Postgres upsert; no DB-per-ping; client interpolation OK.  
- **Depends on:** B5.2.  
- **Parallel with:** —  
- **Touches:** presence publisher/subscriber.  
- **Out of scope:** Ably/Pusher unless measured failure.

#### B5.4 — Visibility pools (looking/matches vs teammates-only)
- **Done when:** Teamed users see teammates only; looking pool respects want-to-be-found; matches rules per day-of/auth.  
- **Depends on:** B5.3, B4.6.  
- **Parallel with:** —  
- **Touches:** presence filter logic + RLS.  
- **Out of scope:** Showing all attendees always.

#### B5.5 — Find person (bearing / warmer-colder / optional outdoor Routes)
- **Done when:** Find target updates live; warmer/colder works; Routes only outdoors + debounced.  
- **Depends on:** B5.4.  
- **Parallel with:** B5.6  
- **Touches:** finder UI.  
- **Out of scope:** Multi-floor Google indoor routing.

#### B5.6 — Meetup pins + hybrid geofence
- **Done when:** User pins; warn + hide outside buffer; org radii configurable if in ERD.  
- **Depends on:** B5.3, B2.6.  
- **Parallel with:** B5.5  
- **Touches:** pins UI, geofence checks.  
- **Out of scope:** Perfect indoor accuracy.

#### B5.7 — In-app day-of notifications
- **Done when:** In-app only for relevant day-of events; no email/push.  
- **Depends on:** B5.3+.  
- **Parallel with:** B5.5–B5.6  
- **Touches:** notification inbox.  
- **Out of scope:** Push/FCM.

**Phase 5 exit:** Two devices find each other under locked privacy.

---

### Phase 6 — Enrichment

#### B6.1 — Grok nickname + Imagine avatar (creds)
- **Done when:** Async job fills stubs; Join path unchanged.  
- **Depends on:** B4.2, `[P]` creds.  
- **Parallel with:** B6.2  
- **Touches:** worker/action.  
- **Out of scope:** Blocking Join.

#### B6.2 — Optional resume → profile suggestions
- **Done when:** Upload to Supabase Storage; suggestions sheet; never gates Join.  
- **Depends on:** B4.2.  
- **Parallel with:** B6.1  
- **Touches:** storage + review UI.  
- **Out of scope:** Mandatory resume.

#### B6.3 — Org polish + optional PWA
- **Done when:** Moderation/track/timeline UX improved; PWA only if day-of friction observed.  
- **Depends on:** Phase 4–5.  
- **Parallel with:** B6.1–B6.2  
- **Touches:** org UI, optional manifest.  
- **Out of scope:** Native shell.

---

## Day-1 wave (spawn 2–4 agents)

Pick **one** wave depending on whether schema design is already approved:

### Wave A — Schema not locked yet (design-first)
| Agent | Card | Notes |
|-------|------|--------|
| A1 | **B0.3** Schema priorities → ERD + RLS sketch | Blocks all Phase 2 |
| A2 | **B0.1** Sync SoT docs into Origin/GitHub | Unblocks other agents’ checkouts |
| A3 | **B0.4** Provision Vercel/Supabase/Auth0/Maps env | Parallel; `.env.example` only |
| A4 (optional) | **B0.2** Mirror snappiness locks into repo AGENTS | Can merge with A2 |

### Wave B — Schema approved; start coding foundations
| Agent | Card | Notes |
|-------|------|--------|
| B-a | **B1.1** Next.js + shadcn on Vercel | Foundation |
| B-b | **B1.2** Supabase client + migrations pipeline | Parallel with B-a after repo/env |
| B-c | **B1.3** Auth0 + anon session | Parallel with B-a |
| B-d | **B2.1** (only if ERD approved) Core tenancy migrations | Do **not** start map/chat UI |

**Day-1 anti-spawn:** B4.*, B5.*, chat UI, Maps loader, Grok live calls.

---

## Spawn checklist (for Meet)

When spawning an implementer, paste:
1. Card ID + title  
2. Link to this file + AGENTS.md + relevant SoT docs  
3. Done-when + depends-on + out-of-scope verbatim  
4. Reminder: no `[D]`; stub `[P]`; honor perf-risks  

---

## Status

| Item | State |
|------|--------|
| UX / stack / snappiness | Locked |
| Schema priorities / ERD | In deliberation — gate for Wave B Phase 2 |
| App feature code | Not started until Meet says go |
