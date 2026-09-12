# Converge — Concept index (brainstorm hierarchy)

**Purpose:** Numbered map of every locked product concept so agents can parse and jump to detail.  
**Vision entrypoint:** [vision.md](vision.md) · **Agent guide:** [../AGENTS.md](../AGENTS.md)

**Legend:** `[L]` locked · `[D]` deferred · `[P]` pending external creds

---

## 0. Meta

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 0.1 | Product vision | [L] | [vision.md](vision.md) |
| 0.2 | Project framing (process > algorithms) | [L] | [project-context.md](project-context.md) |
| 0.3 | UX phase checklist | [L] through day-of | [ux-brainstorm.md](ux-brainstorm.md) |
| 0.4 | Recommendations / ranking / auto-match | [D] | Explicitly out of MVP |
| 0.5 | Agent operating guide | [L] | [../AGENTS.md](../AGENTS.md) |

---

## 1. Client medium

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 1.1 | Primary client = **web** | [L] | [medium.md](medium.md) |
| 1.2 | Framework = **Next.js** | [L] | [medium.md](medium.md) |
| 1.3 | No install required to join | [L] | [medium.md](medium.md) |
| 1.4 | Optional PWA later | [L] leaning | [medium.md](medium.md) |
| 1.5 | Native app MVP | [D] | Only if web GPS/push fails later |

---

## 2. Auth & access

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 2.1 | Auth0, one app for org + candidate | [L] | [auth.md](auth.md) |
| 2.2 | Google login only (MVP) | [L] | [auth.md](auth.md) |
| 2.3 | Progressive access (browse before sign-in) | [L] | [auth.md](auth.md) |
| 2.4 | One Auth0 user globally; one participation per event | [L] | [auth.md](auth.md) |
| 2.5 | Per-event nickname (PII when shown) | [L] | [auth.md](auth.md) |
| 2.6 | Nickname via Grok; avatar via Grok Imagine | [P] | Creds pending — [auth.md](auth.md) |
| 2.7 | Signed-out: event + anonymized looking; like; report | [L] | [auth.md](auth.md) |
| 2.8 | Signed-out cannot chat or see PII/socials | [L] | [auth.md](auth.md) |
| 2.9 | Signed-in: chat + names/nicknames/socials (per rules) | [L] | [auth.md](auth.md) |
| 2.10 | Socials default public to signed-in; opt-out private; never signed-out | [L] | [auth.md](auth.md) |
| 2.11 | Like without Auth0; anon “Someone liked you”; merge on login | [L] | [auth.md](auth.md) §5 |
| 2.12 | Mutual like → “It’s a match” UI | [L] | [pre-hackathon.md](pre-hackathon.md), [auth.md](auth.md) |
| 2.13 | Report anytime → organizers; suspend/ban ladder | [L] | [auth.md](auth.md) |

---

## 3. Organization & events

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 3.1 | Soft cap ~10 events/org (docs only, not public UI) | [L] | [auth.md](auth.md) |
| 3.2 | Creator = owner; invite admins by email | [L] | [auth.md](auth.md) |
| 3.3 | Owner-only delete event | [L] | [auth.md](auth.md) |
| 3.4 | Share = link + copy + event code | [L] | [auth.md](auth.md), [onboarding.md](onboarding.md) |
| 3.5 | Global landing **Enter code** | [L] | [pre-hackathon.md](pre-hackathon.md) T6 |
| 3.6 | Event: name, times, venue name; address TBA OK | [L] | [onboarding.md](onboarding.md) |
| 3.7 | Timeline milestones supported | [L] | [onboarding.md](onboarding.md) |
| 3.8 | **Max team size required**; ≥1 track required | [L] | [onboarding.md](onboarding.md) |
| 3.9 | Track names hidden until publish; org preview | [L] | [auth.md](auth.md) |
| 3.10 | Personal track interest; team track overrides | [L] | [auth.md](auth.md) |
| 3.11 | Any member changes team track; notify group chat | [L] | [auth.md](auth.md) |
| 3.12 | Org enables day-of map; auto-off at event end | [L] | [auth.md](auth.md), [day-of.md](day-of.md) |

---

## 4. Candidate onboarding

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 4.1 | View event without auth; **Join** collects min profile | [L] | [onboarding.md](onboarding.md) C6 |
| 4.2 | Min fields: looking, skills (chips+tags), single role, experience band, desired team size | [L] | [onboarding.md](onboarding.md) |
| 4.3 | Optional org affiliation; optional bio | [L] | [onboarding.md](onboarding.md) |
| 4.4 | Manual budget ~60–90s without resume | [L] | [onboarding.md](onboarding.md) |
| 4.5 | Optional resume → agent propose fills (incl. socials); user confirms | [L] | [onboarding.md](onboarding.md) |
| 4.6 | Resume never a gate | [L] | [onboarding.md](onboarding.md) |

---

## 5. Pre-hackathon UX

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 5.1 | Event page = **single continuous scroll** | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.2 | Looking list default sort = **most recent** | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.3 | Tag-similarity recommendations | [D] | Later |
| 5.4 | No like cap | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.5 | Pre-event notifications = **in-app only** | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.6 | One-way like → My likes; mutual → match ceremony | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.7 | PII anonymized until viewer signs in | [L] | [pre-hackathon.md](pre-hackathon.md), [auth.md](auth.md) |
| 5.8 | 1:1 chat (post-Auth0); no global #looking channel MVP | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.9 | Form teams **before day-of**; every team has **group chat** | [L] | [pre-hackathon.md](pre-hackathon.md) |
| 5.10 | Create team: any signed-in joiner | [L] | T1 |
| 5.11 | Invites: in-app **and** link/code | [L] | T2 |
| 5.12 | Creator kick/rename; any member invite | [L] | T3 |
| 5.13 | Looking auto-off when team full; else “needs N more” | [L] | T4 |
| 5.14 | Leave anytime; last member → dissolve | [L] | T5 |
| 5.15 | One team at a time **per event**; multi-event OK | [L] | T7 |
| 5.16 | Switch team same event: **user chooses** stay vs leave-and-join | [L] | T7 |
| 5.17 | Creator leave: **must pick new creator** | [L] | T8 |

---

## 6. Day-of UX

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 6.1 | Map-first full-screen when location mode on | [L] | [day-of.md](day-of.md) D3 |
| 6.2 | Must **Join** before sharing location | [L] | D4 |
| 6.3 | Need own location to see others / navigate | [L] | [auth.md](auth.md) |
| 6.4 | Not on team: see looking + matches (sharing) | [L] | D1 |
| 6.5 | On team: see **teammates only**; team pins private to team | [L] | D1 |
| 6.6 | Finder: visible + location on + **want to be found** | [L] | D2 |
| 6.7 | Indoor: coarse + warmer/colder | [L] | [day-of.md](day-of.md) |
| 6.8 | Users can drop meetup pins | [L] | D5 |
| 6.9 | Day-of notifs = in-app only | [L] | D6 |
| 6.10 | Geofence hybrid: warn far; outer buffer → invisible | [L] | D7 |
| 6.11 | Realtime real maps (not static floor plan MVP) | [L] | [auth.md](auth.md) |

---

## 7. Design system

| ID | Concept | Status | Detail |
|----|---------|--------|--------|
| 7.1 | Dithered light field; convergence carries state | [L] | [design/field.md](design/field.md) |
| 7.2 | Field renderer — import, do not reimplement | [L] | [design/proof/field-renderer.js](design/proof/field-renderer.js) |
| 7.3 | Ground `#000`; hue only destructive + confirmed | [L] | [design/color.md](design/color.md) |
| 7.4 | Kanit / Schibsted Grotesk / Martian Mono | [L] | [design/type.md](design/type.md) |
| 7.5 | Radius encodes surface weight; no shadows | [L] | [design/form.md](design/form.md) |
| 7.6 | Two motion domains; one moment per route | [L] | [design/motion.md](design/motion.md) |
| 7.7 | morphicons (two-state) vs animate-ui (feedback) | [L] | [design/icons.md](design/icons.md) |
| 7.8 | Field convergence as day-of warmer/colder | [L] | [design/field.md](design/field.md) §4.1 · §6 |
| 7.9 | Tier 2 panels, Tier 3 hairline, baked fallbacks | Open | [design/field.md](design/field.md) §12 |

---

## 8. Implementation reading order (agents)

1. [../AGENTS.md](../AGENTS.md)  
2. [vision.md](vision.md)  
3. This [INDEX.md](INDEX.md) — jump by ID  
4. Domain SoTs: [auth.md](auth.md) → [onboarding.md](onboarding.md) → [medium.md](medium.md) → [pre-hackathon.md](pre-hackathon.md) → [day-of.md](day-of.md)  
5. Visual language: [design/README.md](design/README.md) → [design/field.md](design/field.md)  
6. Build only what the active task needs; do not implement deferred `[D]` items unless asked  

---

## 9. Quick “where is X?”

| Looking for… | Go to |
|--------------|--------|
| Sign-in / who sees names | §2 · [auth.md](auth.md) |
| Join form fields | §4 · [onboarding.md](onboarding.md) |
| Next.js / web vs app | §1 · [medium.md](medium.md) |
| Likes / match / teams | §5 · [pre-hackathon.md](pre-hackathon.md) |
| Map / finder / geofence | §6 · [day-of.md](day-of.md) |
| Colors, type, radius, motion | §7 · [design/README.md](design/README.md) |
| The header gradient / how to build it | §7.1 · [design/field.md](design/field.md) |
| “Don’t build recommendations” | §0.4 · [project-context.md](project-context.md) |
