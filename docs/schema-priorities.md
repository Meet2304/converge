# Converge — Database schema priorities

**Status:** **Locked** 2026-09-12 (rank 1–9 + hybrid policy).  
**Stack:** Supabase Postgres + Realtime + Storage — [stack.md](stack.md)  
**Snappiness constraints:** [perf-risks.md](perf-risks.md)  
**Product SoTs:** [auth.md](auth.md), [onboarding.md](onboarding.md), [pre-hackathon.md](pre-hackathon.md), [day-of.md](day-of.md)  
**Concrete tables:** [schema.md](schema.md)

---

## 1. What “good database” means for Converge

Converge is not a warehouse and not a pure analytics app. It is a **multi-tenant event product** with:

- Progressive / anonymous → Auth0 identity merge  
- Hot **read** paths (event bootstrap, looking list)  
- Hot **write/ephemeral** paths (likes, chat, live GPS)  
- Strict **privacy** (signed-out anonymization, team-only locations, socials rules)  
- Episodic load spikes (one hackathon weekend), not always-on social network scale  

A good schema here maximizes **correct privacy + snappy event UX**, not perfect theoretical normalization or exotic OLAP shape.

---

## 2. Goals (outcomes we want)

| Goal | Meaning for us |
|------|----------------|
| G1 — Fast event reads | Event home / looking cards load within locked budgets (bootstrap RPC friendly) |
| G2 — Safe by default | RLS can express product rules without heroic per-row joins |
| G3 — Live without DB meltdown | GPS/presence mostly off-DB (Broadcast); DB holds durable truth only |
| G4 — Clear domain model | Org → event → participation → team → chat is obvious to agents & humans |
| G5 — Merge-friendly identity | Anon session → Auth0 user without duplicate participations / lost likes |
| G6 — Evolves without rewrites | New optional fields (tracks, pins, resume) don’t force table explosions |
| G7 — Operable | Indexes, retention, and “what to delete after event” are deliberate |

---

## 3. Absolute priorities (proposed rank — lock with you)

These are the **tie-breakers** when wide vs long (or normalize vs denormalize) conflict.

| Rank | Priority | Why it wins arguments |
|------|----------|------------------------|
| **1** | **Correctness & privacy** | Wrong visibility (names, socials, teammate locations) is a product failure |
| **2** | **Read latency for event UX** | Looking list + bootstrap dominate perceived speed |
| **3** | **Write path isolation for live data** | Never let GPS/chat floods block profile reads |
| **4** | **Simple RLS / authorization surface** | Complex joins-in-policies kill both safety confidence and speed |
| **5** | **Idempotent identity merge** | Progressive access is core; duplicates break trust |
| **6** | **Payload leanness** | Card DTOs stay small; blobs (resume) stay out of list queries |
| **7** | **Operational clarity** | Event-scoped data, clear FKs, predictable indexes |
| **8** | **Flexibility for sparse attributes** | Skills/tags/socials evolve; don’t over-widen core rows |
| **9** | **Analytics / history richness** | Nice-to-have; not MVP-defining (no rec engine yet) |

**Non-priorities for MVP schema:** recommendation features, full audit warehouse, multi-region active-active, storing every GPS ping.

---

## 4. Wide vs long — how we use the words here

| Style | Shape | Strengths | Risks for Converge |
|-------|--------|-----------|---------------------|
| **Wide** | One row, many columns (e.g. participation has role, experience, looking, team_id, nickname…) | Fast single-row reads; bootstrap/joins fewer; RLS simpler | Sparse nulls; migrations for every new field; huge rows if we dump JSON blobs on the card |
| **Long (narrow / EAV / child tables)** | Many rows per entity (skills as rows, socials as rows, timeline milestones as rows) | Flexible; clean filters (“has skill X”); avoids null soup | More joins; easier to accidentally `.select('*')` into waterfalls; RLS harder if over-fragmented |

**Hybrid is the answer** — but the **priority rank above** decides *where* we go wide vs long.

### Proposed hybrid policy (to lock)

| Data | Lean | Reason (mapped to priorities) |
|------|------|--------------------------------|
| Org, event core, participation core profile | **Wide** (bounded columns) | Priorities 2, 4 — bootstrap & RLS |
| Skills / tags | **Long** (child table or typed array with GIN — decide in ERD) | Priority 8 + filter needs; keep participation row lean |
| Social links | **Long** (rows: network, url, visibility) | Privacy per-link (auth.md); Priority 1 |
| Event timeline milestones | **Long** | Variable length; Priority 8 |
| Tracks | **Long** (event_tracks) | ≥1 track; publish rules |
| Likes / matches | **Long** (edge table) | Natural graph; Priority 5 merge |
| Chat messages | **Long** | Append-only; Priority 3 isolation |
| Team membership | **Long** (members) + wide team header | One team/event rule enforceable |
| Live GPS stream | **Not in DB hot path** (Broadcast) | Priority 3 |
| Last-known location | **Wide-ish** on participation or small `locations` row | Sparse persist only |
| Resume file | **Storage + pointer column** | Priority 6 — never embed in list selects |
| Looking card read model | **Wide projection** (view or RPC DTO) | Priority 2 — may denormalize counts later |

---

## 5. Design principles (derived from priorities)

1. **Event is the tenancy boundary** — almost all candidate data scoped by `event_id`.  
2. **Participation is the center of candidate UX** — not global profile alone (per-event nickname, looking, team).  
3. **Hot read models ≠ storage models** — storage can be a bit more normalized; **bootstrap/looking** return a fixed wide DTO.  
4. **Ephemeral ≠ durable** — Broadcast for live; Postgres for truth that must survive refresh.  
5. **RLS-friendly keys** — prefer `event_id`, `user_id`, `team_id` on rows that need checks; avoid deep existence subqueries in policies when possible.  
6. **No unbounded selects** — every list table designed with a cursor index from day one.  
7. **Blobs out of band** — resumes/images in Storage; tables hold URLs/ids.  
8. **Merge is a first-class operation** — anon keys and Auth0 `sub` both modeled explicitly.

---

## 6. Wide vs long decision test (use during ERD)

For each candidate field/group, ask:

1. Is it needed on **every looking card / bootstrap**? → prefer **wide on participation** or denormalized DTO.  
2. Is it **multi-valued or privacy-scoped per item**? → **long**.  
3. Does it change **high-frequency**? → don’t put the stream in Postgres (or only sparse snapshot).  
4. Would adding it as a column force **frequent migrations** for sparse experiments? → **long** or JSONB **with a schema contract** (use sparingly).  
5. Does RLS need to hide **part** of the row from signed-out users? → sometimes **long** (e.g. socials) is safer than one wide row with many nullable PII columns.

---

## 7. Absolute priority lock — **CONFIRMED**

1. Correctness & privacy  
2. Read latency (event/looking/bootstrap)  
3. Live-write isolation (GPS/chat not poisoning reads)  
4. Simple RLS  
5. Identity merge integrity  
6. Lean payloads  
7. Operational clarity  
8. Sparse-attribute flexibility  
9. Analytics/history (lowest for MVP)

**Hybrid policy (§4) also locked:** wide core participation/event; long for skills/socials/timeline/messages/likes; GPS off hot DB path.

---

## 8. Follow-ons (locked with schema §12)

- Skills → child table `participation_skills`  
- `participations.current_team_id` denormalized + trigger  
- Join-before-Auth0 via `anon_session_id` then merge  
- `text` + check (not Postgres enums)  
- Match creation in **app transaction** (unique constraint; no like-insert trigger)

---

## 9. Next

Create Supabase project → apply migrations from [schema.md](schema.md). No product UI until skeleton wave is greenlit.
