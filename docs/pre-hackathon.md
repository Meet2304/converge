# Converge — Pre-hackathon experience

**Status:** Pre-hackathon experience **locked** (ready for day-of next).  
**Aligns with:** [auth.md](auth.md), [onboarding.md](onboarding.md), [medium.md](medium.md).  
**Client:** Next.js web.  
**Goal:** Replace Discord “LF teammates” noise with a clear event surface + looking list + likes/match + teams + chats before doors open.

---

## Locked decisions (Q&A)

| # | Topic | Locked |
|---|--------|--------|
| 1 | Event page IA | **Single continuous scroll** (not tabbed About / People / Timeline) |
| 2 | Likes + match | **One-way like:** you can see people you liked (profiles). **Mutual like:** special **“It’s a match”** UI. **PII stays anonymized until the viewer signs in** (Auth0) |
| 3 | Teams pre-event | **Yes** — candidates can **form teams before day-of**. **Every team has a group chat** |
| 4 | Looking list sort | Default **most recent**. Tag-similarity recommendations = **later** (out of MVP) |
| 5 | Like caps | **None** |
| 6 | Notifications (pre-event) | **In-app only** (no email / browser push for MVP) |
| T1 | Create team | Any **signed-in** (Auth0) event joiner can **Create team** |
| T2 | Invites | **Both** — in-app invite from profile/match **and** team invite link/code |
| T3 | Permissions | **Creator** can kick / rename; **any member** can invite |
| T4 | Looking when teamed | **Auto-off looking when team is full** (at org max). If under max, team can show **“needs N more”** |
| T5 | Leave / dissolve | **Leave anytime** pre-event; if **last member leaves**, team **dissolves** |
| T6 | Landing enter code | **Global field on landing page** (plus deep links) |
| T7 | Multi-team / switch | **One team at a time per event.** Across **different events**, multiple teams OK. If already on a team in that event and accepting another invite: **give the user a choice** (e.g. stay / leave current & join) — never silent auto-switch |
| T8 | Creator leaves | **Must pass creator to someone else** before leaving; **ask whom** (pick a remaining member). If sole member, T5 dissolve applies |

---

## 1. Jobs to be done (pre-event)

| Who | Job |
|-----|-----|
| Candidate | Decide “is this event for me?” → show I’m looking → find / get found → match / chat → **form a team** (with group chat) |
| Organizer | Publish a shareable event → see who’s joining / looking / teamed → nudge timeline without babysitting Discord |
| Returning candidate | Re-open link → resume likes, matches, team, chats |

Success metric (product sense): **time from shared link → visible on looking list ≤ ~2 minutes**.

---

## 2. Candidate journey (locked shape)

```
Link / code
  → Event page — single scroll (signed-out OK)
  → [Join] min profile  (~60–90s)
  → Looking list (newest first)
  → Profile peek → Like  (no Auth0; no like cap)
  → Mutual like → “It’s a match” ceremony
  → Want names / socials / chat → Auth0 Google
  → 1:1 chat and/or form / join team
  → Team group chat (required once team exists)
```

Optional side path anytime after Join: resume upload → agent propose fills → confirm.

**PII rule (reinforce auth.md):** nicknames, real names, socials stay hidden to signed-out viewers — including on “people I liked” and match surfaces until they sign in.

---

## 3. Surfaces

### 3.1 Event page — single scroll
**Order (proposed):**
1. Hero: name, short description, venue (TBA OK), dates
2. Looking status + Join / Browse CTA
3. Timeline strip (if org set milestones)
4. Max team size; tracks TBA / published names
5. **People** (looking list embedded in the scroll)
6. Share block (link, copy, code)

**Hide until rules say so:** track *names* until publish; people PII until viewer Auth0.

**Not on first fold:** dense agenda dumps, sponsor grids, multi-stat dashboards.

### 3.2 Looking list
- Default: `looking = true`, sort **most recent**
- Filters later OK; **no recommendation ranking in MVP**
- Signed-out card: generic avatar, skills, role, experience, desired size, optional affiliation, track soft-pref if public — **no name/nickname**
- Signed-in card: + identity per auth.md
- Actions: open profile, Like, Report; Chat → sign-in if needed

### 3.3 Likes & match
| State | UX |
|-------|-----|
| I liked them (one-way) | They appear in **My likes**; profile visible under anon/signed-in rules; no special ceremony |
| They liked me (one-way) | In-app ping: “Someone liked you”; after sign-in, see who if identifiable |
| Mutual | **“It’s a match”** special UI; clear path to chat (sign-in if needed) and/or invite to team |

- Like works signed out; merges on Auth0 login
- No like cap
- In-app notifications only

### 3.4 Chat
- **1:1** from profile / match
- **Team group chat** — created with the team; every team has one (aligns with auth.md track-change notifies group chat)
- No global #looking channel in MVP (avoid Discord clone)

### 3.5 Teams (pre-event) — locked
- Form **before day-of**; size ≤ org **max team size**
- **Create team:** any Auth0-signed-in joiner
- On create: spin up **team group chat** (required)
- **Invite:** in-app (profile / match) **+** shareable team link/code
- **Creator:** kick members, rename team
- **Any member:** invite
- **Looking:** auto-off when team full; under max → **“needs N more”** (partial teams stay discoverable)
- **Leave:** anytime pre-event; last member out → team dissolves (chat ends with team)
- **Creator leave:** must **choose a new creator** from remaining members before exit; sole member → dissolve (T5)
- **Same event:** at most **one team** at a time; accepting another invite → **explicit choice** (stay vs leave & join)
- **Different events:** may be on multiple teams (one per event)
- Track selection: per auth.md (any member; notify group chat; org lock)
- One participation / one team per user per event (auth.md)

### 3.6 Landing
- **Global “Enter code”** field on landing (resolves event code); deep links still work

### 3.7 “My status” chrome
After Join: looking toggle, edit profile, My likes, Matches, Chats, **My team** (if any).

---

## 4. Organizer pre-hackathon (thin)

- Counts: joined, looking, in teams, reports
- Controls: looking window, track publish/lock, timeline, Share
- No map pre-event

---

## 5. Open items
None for pre-hackathon — proceed to **day-of**.

---

## 6. Explicit non-goals (pre-hackathon MVP)

- Skill/tag recommendation ranking
- Like caps / email / push notifications
- Native app
- Full Discord replacement (megaphone, voice, etc.)
- Map / location (day-of)
