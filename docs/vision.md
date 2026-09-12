# Converge — Product vision (source of truth)

**Status:** Locked from UX brainstorm (auth → onboarding → medium → pre-hackathon → day-of).  
**Audience:** Humans and coding agents. Start here, then follow [INDEX.md](INDEX.md).

---

## One-liner

**Converge** helps hackathon attendees form teams with less Discord friction: light join → useful profiles → pre-event connect → day-of find-each-other on a live map.

## Problem

Team hunting in Discord (or similar chat) is noisy, anonymous in the wrong ways, and hard to turn into real meetups on the venue floor.

## Solution shape

1. **Progressive access** — Browse anonymized looking people before Auth0; Google sign-in unlocks chat and real names/socials.
2. **Pre-hackathon** — Single-scroll event page, looking list, likes + “It’s a match,” 1:1 chat, **teams with group chat** before day-of.
3. **Day-of** — Organizer-enabled **map-first** live map, AirTag-like finder, user pins, hybrid geofence; strong **team location privacy**.

## Who it’s for

| Role | Needs |
|------|--------|
| **Candidate** | Join fast, get found / find others, form a team, meet on site |
| **Organizer** | Create/share event, set rules (tracks, max team size, looking window, map on/off), light moderation |

## Non-goals (for now)

- Algorithmic matchmaking / recommendation ranking
- Native app as the join gate
- Full Discord replacement (voice, megaphone channels)
- Perfect indoor blue-dot / BLE

## Stack (locked)

- **Client:** Web-first, **Next.js**, mobile-first for candidates
- **Auth:** Auth0, Google only (MVP)
- Optional later: PWA; native shell only if web GPS fails in practice

## Doc map

| Need | Doc |
|------|-----|
| Agent operating rules | Root [AGENTS.md](../AGENTS.md) |
| Numbered hierarchy of all concepts | [INDEX.md](INDEX.md) |
| Auth / visibility / likes / location gates | [auth.md](auth.md) |
| Org + candidate onboarding fields | [onboarding.md](onboarding.md) |
| Web / Next.js medium | [medium.md](medium.md) |
| Pre-event UX (scroll, likes, teams) | [pre-hackathon.md](pre-hackathon.md) |
| Day-of map / finder / geofence | [day-of.md](day-of.md) |
| Phase checklist / UX index | [ux-brainstorm.md](ux-brainstorm.md) |
| Short project framing | [project-context.md](project-context.md) |

## Conflict rule

**Locked docs win.** If code, chat, or older notes disagree with a locked doc above, change the code/notes — or explicitly revise the locked doc with a product decision. Do not invent ranking, native-required join, or email/push without updating these sources.
