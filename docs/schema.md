# Converge — Proposed Postgres schema (Supabase)

**Status:** Schema decisions **locked** (2026-09-12) — **applied** to Supabase project `converge` (`cxhfmsnkcketqdlcqdic`, `us-east-1`). Migrations: `init_converge_schema`, `enable_rls_and_storage`. RLS on (deny-by-default until Auth0 JWT bridge). Buckets: `avatars`, `covers`, `resumes`.  
**Locks respected:** [schema-priorities.md](schema-priorities.md) (§7 locked), [stack.md](stack.md), [perf-risks.md](perf-risks.md), [auth.md](auth.md), [onboarding.md](onboarding.md), [pre-hackathon.md](pre-hackathon.md), [day-of.md](day-of.md), [plans/execution-order.md](../plans/execution-order.md)  
**Auth note:** Auth0 is identity provider; `users.id` is our UUID. Store `auth0_sub` for linkage. Supabase Auth is **not** the login system.

**Convention:** `uuid` PKs, `timestamptz`, `text` enums via `check` or Postgres enums (TBD at migration), soft-delete only where noted.

---

## 0. Entity map (dependency order)

```
users
  └─ organizations ─ org_memberships
         └─ events ─ event_tracks
                   ─ event_timeline_items
                   ─ participations ─ participation_skills
                                   ─ participation_socials
                                   ─ likes → matches
                                   ─ reports
                                   ─ location_state
                                   ─ meetup_pins
                   ─ teams ─ team_members
                          ─ team_invites
                   ─ conversations ─ conversation_members
                                  ─ messages
                   ─ notifications (in-app)
```

Live GPS stream: **not a table of pings** — Supabase Realtime **Broadcast**. `location_state` holds consent + sparse last-known only.

---

## 1. Identity & tenancy

### 1.1 `users`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | App user id |
| `auth0_sub` | text unique not null | Auth0 subject |
| `email` | text | From Google; org invites |
| `display_name` | text null | Real name when known (signed-in PII) |
| `created_at` / `updated_at` | timestamptz | |

**Tradeoff:** Separate `users` vs only Auth0 claims.  
→ **Separate row:** needed for FKs, anon merge targets, org membership without calling Auth0 on every RLS check.  
**Not storing:** passwords (Auth0).

### 1.2 `anon_sessions`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | Cookie-stable anon id |
| `merged_user_id` | uuid null → users | Set on Auth0 login merge |
| `created_at` / `last_seen_at` | timestamptz | |

**Tradeoff:** Cookie-only anon vs table.  
→ **Table:** likes/reports/location before login need a durable actor id + merge audit ([auth.md](auth.md)).

### 1.3 `organizations`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `name` | text not null | |
| `slug` | text unique not null | |
| `owner_user_id` | uuid → users | Sole owner; delete-event power |
| `contact_email` | text | |
| `logo_url` / `website` / `description` | text null | Optional |
| `created_at` / `updated_at` | timestamptz | |

**Tradeoff:** Soft-cap 10 events in DB trigger vs app only.  
→ **App + documented check** first; optional trigger later (don’t show in UI).

### 1.4 `org_memberships`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `org_id` | uuid → organizations | |
| `user_id` | uuid → users | |
| `role` | text check (`owner` \| `admin`) | Owner also represented here or only on org — **prefer membership row + owner_user_id mirror** |
| unique `(org_id, user_id)` | | |

**Tradeoff:** Owner only on `organizations.owner_user_id` vs membership.  
→ **Both:** `owner_user_id` for fast “can delete”; membership for listing admins/invites.

---

## 2. Events

### 2.1 `events` (**wide** core)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `org_id` | uuid → organizations | |
| `name` | text not null | |
| `slug` | text | Unique per org or global |
| `short_description` | text not null | Signed-out visible |
| `long_description` | text null | |
| `venue_name` | text not null | |
| `venue_address` | text null | TBA OK |
| `timezone` | text not null | |
| `starts_at` / `ends_at` | timestamptz not null | Map auto-off at end |
| `expected_attendance` | int null | |
| `cover_image_url` | text null | Storage URL |
| `max_team_size` | int not null check > 0 | Required |
| `min_team_size` | int not null default 1 | |
| `looking_opens_at` | timestamptz not null | |
| `map_enabled` | boolean not null default false | Org day-of toggle |
| `chat_enabled` | boolean not null default true | |
| `map_center_lat` / `map_center_lng` | float null | |
| `geofence_radius_m` | int null | Soft warn |
| `geofence_hide_radius_m` | int null | Hard hide |
| `share_code` | text unique not null | Global enter-code |
| `tracks_published_at` | timestamptz null | Global publish; or per-track |
| `track_selection_locked_at` | timestamptz null | |
| `code_of_conduct_url` / `support_contact` | text null | |
| `created_by` | uuid → users | |
| `created_at` / `updated_at` | timestamptz | |

**Tradeoff — timeline on event JSON vs child table:**  
→ **Child table** `event_timeline_items` (variable length, ordered). Keeps `events` wide but bounded.

**Tradeoff — tracks as enum columns vs rows:**  
→ **`event_tracks` rows** (≥1 required). Publish hide is per product rules.

### 2.2 `event_tracks`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `name` | text not null | Hidden until publish |
| `sort_order` | int not null | |
| `published_at` | timestamptz null | If per-track publish |
| unique `(event_id, name)` | | |

### 2.3 `event_timeline_items`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `label` | text not null | |
| `occurs_at` | timestamptz not null | |
| `sort_order` | int not null | |

---

## 3. Participation (candidate center — **wide** core)

### 3.1 `participations`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `user_id` | uuid null → users | Null until Auth0 merge if we allow pre-auth Join… **Product:** Join collects profile before Auth0 for chat; participation can exist with `anon_session_id` then attach `user_id` |
| `anon_session_id` | uuid null → anon_sessions | For pre-login Join/likes continuity |
| unique `(event_id, user_id)` where user_id not null | | One participation per user per event |
| unique `(event_id, anon_session_id)` where anon_session_id not null | | |
| `looking` | boolean not null | Auto-off when team full |
| `role` | text not null | Single role preference |
| `experience` | text not null check (`first`\|`some`\|`experienced`) | |
| `desired_team_size` | int not null | Within event max |
| `affiliation` | text null | Company/school/club |
| `bio` | text null | |
| `nickname` | text not null | Per-event; PII when shown |
| `avatar_url` | text not null | Placeholder then Grok |
| `personal_track_id` | uuid null → event_tracks | Soft interest |
| `current_team_id` | uuid null → teams | **Recommended denorm** — maintained by trigger from `team_members` |
| `resume_path` | text null | Storage path only |
| `created_at` / `updated_at` | timestamptz | |

**Tradeoff — Join before Auth0:**  
Product allows browse + Join min profile; chat needs Auth0.  
→ Allow participation with `anon_session_id`; on login **merge** into `user_id` (priority 5). Reject second participation for same user/event.

**Tradeoff — skills as `text[]` vs child table:**  
- `text[]` + GIN: fewer joins, fast card read, harder per-skill metadata.  
- Child table: cleaner caps, chip vs free-tag flag.  
→ **Recommend `participation_skills` child table** (long) with `kind` (`chip`\|`tag`) — matches onboarding “chips + free tags” and priority 8; card DTO aggregates in bootstrap RPC.

### 3.2 `participation_skills` (**long**)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `participation_id` | uuid → participations on delete cascade | |
| `label` | text not null | |
| `kind` | text check (`chip`\|`tag`) | |
| unique `(participation_id, lower(label))` | | Cap N in app |

### 3.3 `participation_socials` (**long**)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `participation_id` | uuid → participations | |
| `network` | text not null | linkedin, github, portfolio, … |
| `url` | text not null | |
| `visibility` | text not null default `signed_in` check (`signed_in`\|`private`) | Never expose to signed-out in API |
| unique `(participation_id, network)` | | |

**Tradeoff — socials columns on participation:**  
→ **Long rows:** per-link private opt-out (auth.md) without wide null PII columns.

---

## 4. Social graph

### 4.1 `likes` (**long**)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | Denormalized for RLS/indexes |
| `from_participation_id` | uuid → participations | |
| `to_participation_id` | uuid → participations | |
| `from_anon_session_id` | uuid null | Backup if liking before participation attach |
| `created_at` | timestamptz | |
| unique `(event_id, from_participation_id, to_participation_id)` | | No like cap |

**Tradeoff — like by user_id vs participation_id:**  
→ **Participation:** likes are event-scoped; simplifies “one participation per event.”

### 4.2 `matches`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `participation_a_id` / `participation_b_id` | uuid | Store ordered a < b for uniqueness |
| `created_at` | timestamptz | |
| unique `(event_id, participation_a_id, participation_b_id)` | | |
| `conversation_id` | uuid null → conversations | Created at match |

**Tradeoff — derive match only from mutual likes vs materialize:**  
→ **Materialize on mutual:** ceremony UI + chat gate + notifications need a stable match id (priority 2 UX).

---

## 5. Teams

### 5.1 `teams` (**wide** header)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `name` | text not null | Creator can rename |
| `creator_participation_id` | uuid → participations | Transfer on leave |
| `track_id` | uuid null → event_tracks | Team track overrides personal |
| `created_at` / `updated_at` | timestamptz | |
| `dissolved_at` | timestamptz null | Soft dissolve |

### 5.2 `team_members` (**long**)
| Column | Type | Notes |
|--------|------|--------|
| `team_id` | uuid → teams | |
| `participation_id` | uuid → participations | |
| `role` | text default `member` | optional |
| `joined_at` | timestamptz | |
| primary key `(team_id, participation_id)` | | |
| **unique `(participation_id)`** where active | | **One team per event** — enforce via unique on participation_id among non-dissolved teams (partial unique index) |

**Tradeoff — `participations.team_id` column vs members-only:**  
→ **Members table + unique participation:** clearer leave/dissolve history; still denormalize `team_id` on participation **optional** for read speed (priority 2). **Recommend:** `participations.current_team_id` nullable FK maintained by trigger — wide read, long source of truth.

### 5.3 `team_invites`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `team_id` | uuid → teams | |
| `code` | text unique null | Link/code invite |
| `invited_participation_id` | uuid null | In-app invite target |
| `created_by_participation_id` | uuid | |
| `expires_at` | timestamptz null | |
| `accepted_at` / `revoked_at` | timestamptz null | |

---

## 6. Chat

### 6.1 `conversations`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid → events | |
| `kind` | text check (`dm`\|`team`) | |
| `team_id` | uuid null → teams | Required if team |
| `match_id` | uuid null → matches | Required if dm from match |
| `created_at` | timestamptz | |

**Tradeoff — reuse one messages table vs separate dm/team tables:**  
→ **One `messages` + conversation kind:** simpler Realtime channel mapping (`dm:{id}`, `team:{id}`).

### 6.2 `conversation_members`
| Column | Type | Notes |
|--------|------|--------|
| `conversation_id` | uuid | |
| `participation_id` | uuid | |
| primary key `(conversation_id, participation_id)` | | |

### 6.3 `messages` (**long**, append-only)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `conversation_id` | uuid → conversations | |
| `sender_participation_id` | uuid → participations | |
| `body` | text not null | |
| `created_at` | timestamptz | |
| index `(conversation_id, created_at desc)` | | Cursor pagination |

**Not in MVP:** reactions, threads, attachments (resume is profile Storage, not chat).

---

## 7. Safety, location, pins, notifications

### 7.1 `reports`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid | |
| `reporter_participation_id` | uuid null | Or anon |
| `reporter_anon_session_id` | uuid null | |
| `target_participation_id` | uuid | |
| `context` | text check (`profile`\|`chat`\|`map`) | |
| `body` | text null | |
| `status` | text default `open` | ladder later |
| `created_at` | timestamptz | |

### 7.2 `location_state` (sparse durable — **not** ping log)
| Column | Type | Notes |
|--------|------|--------|
| `participation_id` | uuid PK → participations | 1:1 |
| `consent_at` | timestamptz null | Join-before-share enforced in app + RLS |
| `sharing_enabled` | boolean not null default false | |
| `want_to_be_found` | boolean not null default false | Finder opt-in |
| `last_lat` / `last_lng` | float null | Sparse upsert ~30–60s |
| `last_located_at` | timestamptz null | |
| `updated_at` | timestamptz | |

**Tradeoff — history table of GPS:**  
→ **No for MVP** (priority 3, stack). Broadcast for live; this row for cold start / refresh.

### 7.3 `meetup_pins`
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid | |
| `created_by_participation_id` | uuid | |
| `team_id` | uuid null | Team-private pin if set |
| `lat` / `lng` | float not null | |
| `label` | text null | |
| `visibility` | text check (`team`\|`self`\|`matches` …) | Default team when teamed |
| `created_at` | timestamptz | |

### 7.4 `notifications` (in-app only)
| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid null | Or participation-scoped |
| `participation_id` | uuid null | |
| `event_id` | uuid | |
| `type` | text | `liked_you`, `match`, `team_invite`, … |
| `payload` | jsonb | Small |
| `read_at` | timestamptz null | |
| `created_at` | timestamptz | |

**Tradeoff — push into Realtime only vs persist:**  
→ **Persist + Realtime poke:** survives refresh; still in-app only (no email).

---

## 8. Read models (not extra source of truth)

### 8.1 `event_bootstrap(event_id, viewer)` RPC
Returns: event public fields, timeline, tracks (respect publish), first page of looking cards (compact DTO), viewer participation/team status.

**Tradeoff — view vs RPC:**  
→ **RPC:** applies viewer auth (signed-out anonymize nicknames/socials) in one round-trip (perf P7).

### 8.2 Looking card DTO (computed)
Include: participation id, looking, role, experience, desired size, affiliation, skills labels, avatar (generic if signed-out), nickname **only if viewer signed in**, team “needs N” badge — **no resume, no private socials**.

---

## 9. Index starter set (must-have)

| Index | Why |
|-------|-----|
| `events(share_code)` unique | Global enter-code |
| `events(org_id)` | Org dashboard |
| `participations(event_id, looking, created_at desc)` | Looking list recent |
| `participations(event_id, user_id)` unique | One per event |
| `likes(event_id, to_participation_id, created_at desc)` | “Liked you” |
| `likes(event_id, from_participation_id)` | My likes |
| `messages(conversation_id, created_at desc)` | Chat page |
| `team_members(participation_id)` unique active | One team |
| `notifications(participation_id, created_at desc)` | Inbox |

---

## 10. RLS posture (logical)

| Audience | Can read | Cannot |
|----------|----------|--------|
| Signed-out | Event public fields; anonymized looking cards; no socials/names | Chat, PII, team locations |
| Signed-in participant | Names/nicknames/socials per rules; own likes; match chats | Other teams’ live locations |
| Teamed | Teammate location_state / team pins | Looking-pool locations (day-of D1) |
| Org admin | Participants, reports, flags for their events | Act as candidate unless also participated |

Policies should key off `event_id`, `org_id`, `participation_id`, `team_id` — avoid deep nested exists where possible (priority 4).

---

## 11. Storage buckets (Supabase Storage)

| Bucket | Contents |
|--------|----------|
| `avatars` | Placeholder + Grok images |
| `covers` | Event covers / org logos |
| `resumes` | Private; path on participation only |

---

## 12. Schema decisions — **LOCKED** (2026-09-12)

| # | Decision | Lock |
|---|----------|------|
| 1 | Skills | **`participation_skills` child table** (`kind`: chip \| tag) |
| 2 | `participations.current_team_id` | **Yes** — denormalized, maintained by trigger from `team_members` |
| 3 | Join before Auth0 | **Yes** — participation via `anon_session_id`, merge to `user_id` on login |
| 4 | Enum style | **`text` + `check` constraints** (not Postgres enums) |
| 5 | Match creation | **App transaction** (create match + conversation together); unique constraint prevents duplicates — not a DB trigger on like insert |
| 6 | Priority rank | **Confirmed as proposed** — see [schema-priorities.md](schema-priorities.md) §7 |

---

## 13. Next step

1. ~~Lock §12 answers + priorities.~~ **Done.**  
2. ~~Create Supabase project.~~ **Done** — `converge` / `cxhfmsnkcketqdlcqdic` / `us-east-1`.  
3. ~~Apply core migrations.~~ **Done** — tables + RLS + storage buckets.  
4. Remaining: Auth0↔Supabase JWT/RLS policies, `event_bootstrap` RPC, app wiring.  
5. Still no product UI until skeleton wave — per [build-order.md](build-order.md).
