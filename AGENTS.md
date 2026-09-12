# AGENTS.md — Converge

Instructions for any coding or research agent working on **Converge**.

## What this product is

Converge is a **web (Next.js)** product for **hackathon team formation**: progressive join → profiles → likes/match → teams/chat before the event → **map-first** find-each-other on day-of.

Read the vision in one pass: [`docs/vision.md`](docs/vision.md).

## Source of truth (do not invent product rules)

| Priority | Doc | Use for |
|----------|-----|---------|
| 1 | [`docs/vision.md`](docs/vision.md) | Central idea, non-goals, stack |
| 2 | [`docs/INDEX.md`](docs/INDEX.md) | Numbered concept hierarchy — jump by ID |
| 3 | [`docs/auth.md`](docs/auth.md) | Auth0, progressive access, PII, likes, reports, location gates |
| 4 | [`docs/onboarding.md`](docs/onboarding.md) | Org event fields + candidate Join profile |
| 5 | [`docs/medium.md`](docs/medium.md) | Web-first + Next.js; no app-required join |
| 6 | [`docs/pre-hackathon.md`](docs/pre-hackathon.md) | Event scroll, looking list, match, teams |
| 7 | [`docs/day-of.md`](docs/day-of.md) | Map-first, privacy, finder, pins, geofence |
| 8 | [`docs/stack.md`](docs/stack.md) | Supabase, Vercel, Google Maps, shadcn, Realtime patterns |
| 9 | [`docs/perf-risks.md`](docs/perf-risks.md) | Snappiness budgets & mitigations |
| 10 | [`docs/schema-priorities.md`](docs/schema-priorities.md) | Data-model design priorities |
| 11 | [`docs/schema.md`](docs/schema.md) | Tables, indexes, RLS posture (applied to Supabase) |
| 12 | [`docs/design/`](docs/design/README.md) | **Visual language** — color, type, radius, motion, icons, the dithered field |
| 13 | [`docs/ux-brainstorm.md`](docs/ux-brainstorm.md) | Phase status checklist |
| 14 | [`docs/project-context.md`](docs/project-context.md) | Process-optimization framing |
| 15 | [`docs/build-order.md`](docs/build-order.md) | Agent-ready implementation phases |

**Conflict rule:** Locked docs above win over chat history, README drafts, or assumptions. To change product behavior, update the relevant locked doc (or ask the user) — do not silently diverge in code.

## How to start a task

1. Read this file + `docs/vision.md`.
2. Open `docs/INDEX.md` and note the section IDs your task touches (e.g. `5.x` teams, `6.x` map).
3. Read only the linked SoT docs for those IDs.
4. Implement against those rules (validators, gates, privacy).
5. If something is marked **deferred** in INDEX (`[D]`), skip it unless the user explicitly expands scope.
6. If something is **pending credentials** (`[P]`, e.g. Grok), stub behind config; do not block the rest of the feature.

## Hard constraints agents must respect

- **Next.js web** client; shareable link/code; **no install gate** to join.
- **Auth0 + Google only** for MVP sign-in. **Do not** replace Auth0 with Supabase Auth.
- **Progressive access:** useful anonymized browse before sign-in; chat + PII after.
- **Socials:** never to signed-out viewers; default public to signed-in; per-link private opt-out.
- **Pre-event:** single-scroll event page; likes without like-cap; mutual → match UI; teams + group chat; one team per event at a time.
- **Day-of:** map-first when org enables location; **Join before share location**; teamed users see **teammates only**; finder needs **want to be found**; in-app notifications only; hybrid geofence (warn + hide outside buffer).
- **UI kit:** prefer **shadcn/ui** for chat, dashboards, and app chrome wherever practical; honor [`docs/design/`](docs/design/README.md) for visual language.
- **Visual language:** true `#000` ground, no shadows, hue only for destructive and confirmed state, Kanit never below 16px. The dithered field is imported from [`docs/design/proof/field-renderer.js`](docs/design/proof/field-renderer.js) — do not reimplement it.
- **Snappiness (locked):** honor [perf-risks.md](docs/perf-risks.md) — budgets; optimistic like/chat/looking/team; Maps JS only on day-of + Find; Join never blocked on Grok/resume; split Realtime channels; event bootstrap RPC; live GPS via Supabase **Broadcast** (not DB-per-ping).
- **Do not** build recommendation/ranking engines, native-required flows, email/push, or Discord-clone global channels unless docs are updated.

## Implementation notes

- Prefer small, reviewable diffs aligned to one INDEX section.
- When adding UI copy or empty states, match the locked journey language (Join, Looking, Match, Team, Find, Want to be found).
- Keep org and candidate surfaces in one web app (different modes), per medium/auth.
- Anon session → Auth0 merge for likes, reports, and location (see auth.md).
- Follow [docs/build-order.md](docs/build-order.md) / [plans/execution-order.md](plans/execution-order.md): skeleton → Auth0 → org spine → pre-event → day-of.

## Before creating or updating a pull request

1. Run `bun run format` from the repository root. This must format the entire supported codebase
   with Biome, not only the files changed in the current task.
2. Run `bun run ci` and fix every failure before pushing. The command explicitly verifies Biome
   formatting, lint rules, import organization, TypeScript, tests, dependency security, and the
   production build.
3. Do not create or update a pull request while either command reports a failure. GitHub CI and
   Vercel enforce the same Biome formatting gate.

## Out of scope unless asked

- Recommendation / compatibility ranking
- Native iOS/Android app as primary client
- Perfect indoor positioning / BLE
- Expanding login providers beyond Google

## Agent skills (in-repo)

Installed under [`.cursor/skills/`](.cursor/skills/). Invoke with `/skill-name` in Cursor.

| Skill | When to use |
|-------|-------------|
| [`/i-have-adhd`](.cursor/skills/i-have-adhd/SKILL.md) | Response style — lead with the next action, number steps, restate state; stays on until “stop adhd mode” |
| [`/grill-me`](.cursor/skills/grill-me/SKILL.md) | User-invoked plan grilling — stress-tests a design/plan (calls [`grilling`](.cursor/skills/grilling/SKILL.md)) |

Also present: [`frontend-design`](.cursor/skills/frontend-design/SKILL.md) for UI work.

## Status snapshot

UX through day-of **locked**. Stack + snappiness locked. Schema **locked and applied** to Supabase project `converge`. Design system docs in-repo (pending final sign-off). **Next:** Next.js skeleton → Auth0.
