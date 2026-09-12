# Converge — Auth & Access (Source of Truth)

Implementation reference for authentication, authorization, and stage-by-stage visibility.  
**Status:** Locked from product Q&A. Pending only external API credentials (Grok) where noted.

**Framework:** Auth0 (same application for organizers and candidates).  
**Login method (MVP):** Google / Gmail only.  
**Product framing:** Progressive access — useful browse before sign-in; Auth0 unlocks chat and real names.  
**Out of scope here:** Recommendations / ranking algorithms.

---

## 1. Account model

| Decision | Locked |
|----------|--------|
| Who can create an account | Anyone |
| Auth0 apps | One shared Auth0 app (organizers + candidates) |
| Login providers (MVP) | Google (Gmail) only |
| Global vs event identity | One Auth0 user globally; **one participation per user per event**; **per-event nickname** |
| Nickname visibility | Nickname is **PII-class for display** — **anonymized when viewer is signed out**; visible after viewer signs in |
| Nickname generation | **Random nicknames generated via Grok** (API details TBD — user will share) |
| Default avatar | **Generic Converge-themed profile image** via **Grok Imagine API** (credentials/details TBD — user will share); not user face photos at signup |
| Resumes / heavy signup | Never required at auth; optional resume → agent autofill is product onboarding (see onboarding.md) |

**Roles (logical):** `organizer` (org membership), `candidate` (event participant). Same person may be both across contexts.

---

## 2. Organization perspective

### 2.1 Orgs, ownership & events
| Decision | Locked |
|----------|--------|
| Events per org | Soft cap **10** — document for implementers; **do not show in public UI** |
| Ownership model | **Creator is sole owner**; may **invite other organizers by email** |
| Admin powers | Admins **can create new events** in the same org |
| Delete event | **Owner only** — invited admins **cannot** delete events they were invited to |
| Create event produces | **Link + copy button + event code** (all three; one Share panel) |

**Join surface UX:** One **Share** block — clickable link, one-tap copy, short event code. Not competing modes.

### 2.2 Tracks
| Decision | Locked |
|----------|--------|
| Track semantics | Labels only (not gated rooms/content in MVP) |
| Visibility before publish | **Hide track names** until public time |
| Publish control | Organizer schedules when tracks become public |
| Organizer preview | Yes — unpublished tracks visible to organizers |
| Personal track interest | **Yes** — candidate may set a soft preference before a team exists |
| Team track selection | Once team exists, team selects a track while unlocked; until organizer **locks** selections |
| Team overrides personal | **Yes** — team track **overrides** personal interest for display/dashboards; **inform affected users** of the change |
| Who can change team track | **Any team member** |
| On team track change | **Notify all members in the team’s common group chat** |
| Pre-event team formation | **Yes** — see [pre-hackathon.md](pre-hackathon.md) |
| Team group chat | **Required** — every team has one |
| Create team | Any **signed-in** event joiner |
| Team invites | In-app **and** invite link/code |
| Team permissions | **Creator** kick/rename; **any member** invite |
| Looking when team full | **Auto-off**; under max show **needs N more** |
| Leave team | Anytime pre-event; **last member leaves → team dissolves** |
| One team per event | **Yes** — at most one team at a time **per event**; **multiple events → multiple teams OK** |
| Switch team (same event) | Accepting another invite while teamed: **user chooses** stay vs leave-and-join (no silent switch) |
| Creator leaves | **Transfer creator** — must pick a remaining member before leave; sole member → dissolve |
| Landing event code | **Global enter-code** on landing + deep links |
| Change after select | Yes — until organizer lock |

### 2.3 Organizer visibility & power
| Decision | Locked |
|----------|--------|
| See real candidate PII | Only **after that candidate has signed up** (Auth0) on Converge |
| Dashboards | **Detailed** — participants, looking, map, reports, moderation, etc. |
| Force sign-in for event | **No** |
| Map / location feature window | On when organizer enables (day-of); off when **event ends** or organizer **turns off** |

---

## 3. Candidate perspective — progressive access

### 3.1 Signed out (no Auth0)
**Can:**
- Open event via link or code
- See **event details**
- See **anonymized** people looking for teammates (pre-event tab)
- Day-of (if organizer enabled location mode): see map / others’ locations **only after granting own location access**
- Day-of: share own location while signed out (anonymized pin)
- **Like** people (anonymized context)
- **Report** anyone

**Cannot:**
- Chat / get in touch
- See **PII**, including **real names and nicknames**

### 3.2 Signed in (Auth0 Google)
**Additionally can:**
- Chat with others
- See **real names, nicknames, and other PII** for participants who have signed up (**immediately** after own sign-in — no mutual-match gate for names)
- Use full identified day-of experience (still need location permission for map features)

### 3.3 Auth gates (locked)

| Action | Auth0 required? |
|--------|-----------------|
| View event details | No |
| View anonymized looking list | No |
| View anonymized map (day-of, org-enabled) | No — but **own location permission** required to see others / navigate |
| Share own location (day-of) | No (signed-out allowed) |
| Like | **No** |
| Chat / message | **Yes** |
| See real names / nicknames / PII | **Yes** (viewer signed in); subject’s PII only if they signed up |
| Report | **No** (always available) |

---

## 4. Anonymization & display identity

### 4.1 PII (hidden when viewer is signed out)
- Real name
- Email
- Phone
- Social / Discord / LinkedIn / contact handles (never shown signed-out; see 4.3)
- **Per-event nickname**
- Face / identity photos (MVP uses **generic Converge avatar** from Grok Imagine instead)

### 4.2 Non-PII (visible signed out)
- Skills
- Role tags
- Experience band
- Looking flag
- Desired team-size preference
- Organization affiliation (optional field; treat as non-PII unless it uniquely identifies — Open if abuse)
- Track preference (once tracks are public)
- Non-identifying bio blurb (if present and scrubbed of handles)

### 4.3 Socials visibility
| Decision | Locked |
|----------|--------|
| Default | Socials are **public** (shown to other **signed-in** users) |
| Opt-out | Candidate may mark individual socials **private** |
| Signed-out viewers | **Never** see socials (S1: signed-in only) |

### 4.4 Generated identity helpers
| Asset | Source | Notes |
|-------|--------|-------|
| Default avatar | Grok Imagine API | Converge-themed generic image; user will share API setup |
| Random nickname | Grok | Generated for event participation; treated as PII for visibility (signed-in only) |

---

## 5. Likes & notifications

| Decision | Locked |
|----------|--------|
| Like requires Auth0 | No |
| Like cap | **None** |
| One-way like | Liker can revisit **people they liked** (profile under anon/PII rules) |
| Mutual like | Special **“It’s a match”** UI (see pre-hackathon.md) |
| Notify liked user | **Yes — anonymous ping:** “Someone liked you” (no name while relevant party unsigned); **in-app only** pre-event |
| CTA on ping | **Ask them to sign in to communicate** |
| See who liked you | After **viewer signs in**, liker identity visible if liker has signed up / is identifiable under signed-in rules |
| Persist across login | Anonymous likes merge into Auth0 user on sign-in |
| PII until sign-in | Names/nicknames/socials stay anonymized for signed-out viewers (including likes/match surfaces) |

---

## 6. Location & navigation (day-of)

| Decision | Locked |
|----------|--------|
| When available | Day of hackathon, only after **organizer enables**; ends on event end or org disable |
| Join before share | **Must Join event** (min profile) before sharing location — link-only is not enough |
| Signed-out location share | Allowed **only after Join** (anon session + min profile); Auth0 still not required to share |
| Viewing others / navigate | Requires **granting own location** |
| Map population (not on a team) | **Looking + matches** who are sharing (see day-of.md privacy) |
| Map population (on a team) | **Teammates only** — cannot see other people’s live locations |
| Team location privacy | Teammate live locations are **not** visible to non-teammates |
| Want to be found | Separate opt-in; Finder only targets visible people with location on + this opt-in |
| User pins | Users can **drop pins** (meetup-style) |
| Map type | **Realtime, real maps** (not static venue image) |
| Navigation UX | **In-app** AirTag-like personalized finder |
| Indoor GPS poor | **Coarse pin + warmer/colder** |
| Notifications (day-of) | **In-app only** |
| Geofence | **Hybrid:** warn when too far; past outer buffer → **invisible** to others |
| Map chrome (D3) | **Map-first** full-screen when location mode on; list/profile as sheets / secondary nav |

---

## 7. Safety & moderation

| Decision | Locked |
|----------|--------|
| Report | Available **anytime** (signed out or in) |
| On report | Forwarded to **event organizers** |
| Screenshot upload | **Not required** for MVP |
| Minimum report payload | Reporter (Auth0 user **or** anon session), target, timestamp, event id, optional free-text, context (`profile` / `chat` / `map`) |
| Action ladder | `none` → `warned` → `suspended` → `banned` |
| `suspended` | Hidden from looking list, map, and chat **for that event** (including anonymized signed-out views) |
| `banned` | Cannot rejoin that event |

---

## 8. Session & anonymous continuity (build requirements)

1. **Anonymous session** — signed-out likes, reports, and location pins use a stable anon session id until Auth0 links the account.
2. **Like → chat upgrade** — survive login; prompt sign-in to communicate after anonymous like notification.
3. **Location merge** — on login, merge anon pin/presence into Auth0 user for that event.
4. **Org soft cap (10 events)** — backend/docs only; not shown in public UI.
5. **Grok dependencies** — nickname generation + default avatar; block implementation of those features on missing credentials, not the rest of auth.

---

## 9. Pending external setup (not product-open)

- [ ] Grok API details for **random nicknames** (user will share)
- [ ] Grok Imagine API details for **Converge-themed default avatar** (user will share)

---

## 10. Quick reference — visibility matrix

| Content | Signed out | Signed in |
|---------|------------|-----------|
| Event info | Yes | Yes |
| Track names (before publish) | Hidden | Hidden (organizers: preview) |
| Track names (after publish) | Yes | Yes |
| Others’ non-PII | Yes | Yes |
| Others’ PII / names / nicknames | No | Yes (if they signed up) |
| Socials (default public) | No | Yes (unless owner marked private) |
| Default avatar | Generic Converge art | Same / identified context |
| Looking list | Anonymized | Identified |
| Like | Yes | Yes |
| Like notification | Anonymous “Someone liked you” + sign-in CTA | Can see who (per signed-in rules) |
| Chat | No | Yes |
| Map (org-enabled) | Anonymized; needs own location | Identified; needs own location |
| Report | Yes | Yes |
