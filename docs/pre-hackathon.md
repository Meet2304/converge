# Converge — Pre-hackathon experience (brainstorm draft)

**Status:** Ideation — not locked. Aligns with [auth.md](auth.md), [onboarding.md](onboarding.md), [medium.md](medium.md).  
**Client:** Next.js web.  
**Goal:** Replace Discord “LF teammates” noise with a clear event surface + looking list + light connect loop before doors open.

---

## 1. Jobs to be done (pre-event)

| Who | Job |
|-----|-----|
| Candidate | Decide “is this event for me?” → show I’m looking → find / get found → chat enough to form or soft-commit a team |
| Organizer | Publish a shareable event → see who’s joining / looking → nudge timeline (tracks publish, looking window) without babysitting Discord |
| Returning candidate | Re-open link → resume where they left (likes, profile, chats) |

Success metric (product sense, not analytics yet): **time from shared link → visible on looking list ≤ ~2 minutes** (matches onboarding budget).

---

## 2. Candidate journey (proposed shape)

```
Link / code
  → Event page (signed-out OK)
  → [Join] min profile  (~60–90s)
  → Looking list / people
  → Profile peek → Like  (no Auth0)
  → Want to talk → Auth0 Google
  → Chat (+ see names / socials)
  → Soft team intent (later / light)
```

Optional side path anytime after Join: resume upload → agent propose fills → confirm.

---

## 3. Surfaces to define

### 3.1 Event page (hero of pre-hackathon)
**Always visible (signed out):**
- Event name, short description, venue name (TBA OK), start/end
- **Timeline** strip if org set milestones (doors, ceremony, track reveal, hacking end, demos)
- Looking window status (“Looking open” / opens at …)
- Max team size; track count or “tracks TBA until …”
- Share affordances: link, copy, code (same Share panel pattern as org)
- Primary CTA: **Join** (if not joined) / **Browse people** (if joined)

**Hide until rules say so:** track *names* until publish; socials/PII of people.

**Not on first fold (lean):** dense agenda dumps, sponsor grids, multi-stat dashboards — keep one job: “understand event + join or browse.”

### 3.2 Looking list
- Default filter: `looking = true`
- Card content when **signed out:** avatar (generic), skills, role, experience band, desired team size, optional org affiliation, track soft-pref if public — **no nickname/name**
- Card content when **signed in:** + nickname / real name if they signed up; socials per auth rules
- Actions on card: open profile, **Like**, **Report**; **Chat** only if signed in (else Chat → sign-in prompt)
- Sort / filter (brainstorm options — pick later): role, skills overlap with me, experience, desired size, track interest; **no smart ranking engine yet** — simple filters + recency / joined time is enough

### 3.3 Profile peek / full profile
- Same visibility matrix as auth.md
- Like + Chat CTA placement obvious
- Resume never required; show filled fields only

### 3.4 Likes loop
- Like works signed out; merges on login
- Notify liked user: anonymous “Someone liked you” + sign-in to talk
- After sign-in: see who liked you (if identifiable)
- Inbox / “Likes” tab? (open question)

### 3.5 Chat (post-Auth0)
- 1:1 first (MVP lean) vs also “looking channel”?  
  **Lean:** 1:1 from profile/like is enough pre-event; avoid recreating Discord #general unless organizers need an announcement surface (org can use timeline + external Discord)
- Empty state: “Like someone or open a profile to start a chat”
- Persist across devices via Auth0 user

### 3.6 “My status” chrome
Always reachable after Join:
- Looking toggle
- Edit min profile / nickname / socials privacy
- Track interest (when tracks public)
- Entry to likes + chats

---

## 4. Organizer pre-hackathon (thin for now)

- Dashboard: participant count, looking count, report queue
- Controls already locked: looking opens, track publish/lock, timeline edits, Share panel
- Pre-event they mostly **don’t** need map

---

## 5. Open questions (to lock next)

1. **Looking list default sort** — newest joiners vs random vs “looking first” only?
2. **Mutual like** — any special UX, or likes are one-way pings until chat?
3. **Team object pre-event** — form/invite team before day-of, or chat-only until day-of?
4. **Capacity / noise** — soft cap on how many you can like? rate limits?
5. **Event page sections** — single scroll vs tabs (`About` | `People` | `Timeline`)?
6. **Code entry** — global home “Enter code” vs only deep links?
7. **Notifications channel** — email / browser push / in-app only for like pings pre-event?

---

## 6. Explicit non-goals (pre-hackathon MVP)

- Recommendation / match scores
- Native app
- Full Discord replacement (announcement megaphone, voice, etc.)
- Map / location (day-of doc)
