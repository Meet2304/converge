# Converge — Day-of experience

**Status:** Day-of experience **locked**.  
**Builds on:** [auth.md](auth.md), [pre-hackathon.md](pre-hackathon.md), [medium.md](medium.md).  
**Client:** Next.js web.  
**Goal:** Help people find each other on site — teammates, matches, still-looking — with strong location privacy.

---

## Locked decisions (Q&A)

| # | Topic | Locked |
|---|--------|--------|
| D1 | Who appears / who can see | **Pools:** looking + my team + matches. **Privacy:** if you are **already on a team**, you **only see your teammates’ locations** — not other looking people or matches. Teammate live locations are **team-private** (not shown to outsiders). |
| D2 | Finder targets | **Anyone you can see** who has location **on** and opted **“want to be found”** |
| D3 | Map chrome / layout | **A — Map-first:** when location mode is on, opening the event goes to a **mostly full-screen live map**; list/profile as sheets or secondary nav |
| D4 | Join before location | **Must Join the event** (min profile) before sharing location |
| D5 | Pins | Users can **drop / pin locations** (meetup-style pins) |
| D6 | Notifications | **In-app only** |
| D7 | Geofence | **Hybrid:** beyond a set distance outside the venue region, location becomes **invisible to others**; user gets a **warning** when they go too far |

### Already locked (earlier)

| Topic | Locked |
|--------|--------|
| Map window | Organizer enables day-of; off on event end or organizer disable |
| Map type | Realtime real maps |
| See others / navigate | Requires granting **own** location |
| Finder UX | AirTag-like personalized finder |
| Indoor GPS poor | Coarse pin + **warmer / colder** |
| PII on map | Anonymized if viewer signed out; identified if signed in (auth.md) |

---

## 1. Jobs to be done

| Who | Job |
|-----|-----|
| Still looking (no team) | See looking + matches who share location; find / meet |
| On a team | See **only teammates**; regroup via finder / pins |
| Anyone joined | Drop a pin; opt into “want to be found”; stay inside geofence |
| Organizer | Enable map; set venue region; moderate |

---

## 2. Candidate journey (locked shape)

```
Open event (org location mode on)
  → Map-first full-screen live map
  → Must already have Joined (min profile) to share location
  → Grant location → appear per privacy rules
  → Finder / drop pin / sheets for list & profile
  → Opt-in “want to be found” to be Finder-targetable
  → Leave venue buffer → warn; further out → invisible to others
```

---

## 3. Surfaces

### 3.1 Map chrome
- **Map-first** when location mode is on: mostly full-screen map as the day-of home for that event
- Looking list / profile / team / chat as **sheets** or secondary navigation (not the primary scroll)

### 3.2 Map visibility matrix

| Viewer state | Sees on map |
|--------------|-------------|
| Joined, **not** on a team, sharing location | **Looking** people + **matches** who are sharing (and not team-private); not other teams’ internal pins |
| Joined, **on a team**, sharing location | **Teammates only** |
| Not joined | Cannot share location; map rules follow Join gate |

### 3.3 Finder
- Target: visible person with location on + **want to be found**
- Outdoor: bearing / distance as feasible on web
- Indoor: warmer / colder
- Entry from map pin / profile / team roster

### 3.4 User pins
- Drop pin on map (label optional)
- Share with team (default for teamed users) and/or expose per privacy rules — fine detail later if needed
- Distinct from live GPS presence

### 3.5 Geofence
- Org sets venue center / region (when address known; TBA until set)
- Soft: **warn** when leaving comfortable radius
- Hard: past outer buffer → **hide** your live location from others (you keep map; others lose you)

### 3.6 Organizer
- Toggle location mode
- Configure geofence / warn + hide radii
- Live counts, reports, force-hide abusive pins

---

## 4. Auth alignment
- **Join before share** — no Join → no location share; post-Join anon session may share without Auth0
- Map chrome, visibility, finder opt-in, pins, geofence mirrored in [auth.md](auth.md) §6

---

## 5. Open items
None for day-of — UX phase complete through day-of; **execution** next when ready.

---

## 6. Explicit non-goals (MVP)

- Perfect indoor blue-dot / BLE beacons
- Native app requirement
- AR navigation
- Official venue floor-plan replacement
- Email / push notifications
