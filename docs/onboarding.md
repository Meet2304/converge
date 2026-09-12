# Converge — Onboarding (Source of Truth)

What each side provides when joining. Aligns with [auth.md](auth.md).  
**Status:** Locked from product Q&A (pending Grok API credentials only, shared with auth.md).

**Principles**
- **Organization:** detailed enough to run an event (schedule, venue, tracks, timeline, controls).
- **Candidate:** minimum manual friction; **optional resume → agent autofill** for richer profile/socials.
- Generated defaults: **Grok nickname** (always editable), **Grok Imagine** Converge avatar (API TBD).

---

## 1. Organization onboarding

### 1.1 Create organization (first time)
| Field | Required? | Notes |
|-------|-----------|-------|
| Org display name | Yes | |
| Org slug | Yes (auto from name OK) | |
| Owner account | Yes | Auth0 Google |
| Contact email | Yes | Default Google email |
| Logo / website / description | Optional | |

### 1.2 Create event
| Field | Required? | Notes |
|-------|-----------|-------|
| Event name | Yes | |
| Short description | Yes | Visible signed out |
| Long description / agenda | Optional | |
| **Timeline** | Optional but supported | Ordered milestones: label + datetime (e.g. doors, opening ceremony, track reveal, hacking ends, demos). Shown on event page |
| Venue name | Yes | |
| Venue address / place | Optional | **TBA allowed**; map center can be set later before day-of |
| Map center / geofence | Optional until map enable | Needed before location mode |
| Start / end datetime + timezone | Yes | End also drives map auto-off |
| Expected attendance | Optional | |
| Cover image | Optional | |
| Share artifacts | Auto | Link + copy + code |
| **Max team size** | **Yes** | Defined by organization (no silent default that skips the decision) |
| Min team size | Optional | Default 1 |
| “Looking” opens | Yes | datetime or on create |
| Location/map mode | Default off | Org enables day-of |
| Chat enabled | Default on | |
| **Tracks** | **≥ 1 required** | Labels; names hidden until publish |
| Track publish at | Yes if tracks exist | Per-track or global |
| Track selection lock at | Optional | or manual lock |
| Code of conduct URL | Optional | |
| Support contact | Optional | |

### 1.3 Invite organizers
| Field | Required? | Notes |
|-------|-----------|-------|
| Invitee email | Yes | |
| Role | Yes | `admin`; owner = creator |

### 1.4 Org UX intent
1. Google sign-in → create org  
2. Create event (name, description, schedule, venue name, **max team size**, **≥1 track**)  
3. Optional: timeline, address, branding, invites  
4. Dashboard + Share panel  

**Target:** core event in ≤ ~5 minutes.

---

## 2. Candidate onboarding

### 2.1 Enter event
- Link or event code → event details (no Auth0 required)

### 2.2 Minimum manual profile
| Field | Required? | Notes |
|-------|-----------|-------|
| Looking for teammates? | Yes | Boolean |
| Skills | Yes | **Fixed chips + free tags** (cap N at implementation, e.g. 8–12) |
| Role preference | Yes | **Single** choice |
| Experience band | Yes | `first` / `some` / `experienced` |
| Desired team size | Yes | Preference within org max (e.g. want 2–4) |
| Organization (company/school/club) | Optional | Not “school” only — general **organization** affiliation |
| Track interest | Optional until tracks public | Soft preference |
| Short bio | Optional | Non-PII; no undeclared handles in bio |
| Nickname | Auto (Grok) | **Always editable** |
| Avatar | Auto (Grok Imagine) | Converge-themed default |
| Real name / email | From Google at Auth0 | Not a separate pre-auth form |

### 2.3 Optional resume → agent fill
| Decision | Locked |
|----------|--------|
| Resume required? | **No** — never a gate |
| Resume upload | Optional anytime during/after min profile |
| Agent behavior | Parse resume → propose fills for skills, role, experience, organization, bio, **socials** |
| User control | Review/edit before apply; can reject fields |
| Socials from resume | LinkedIn, GitHub, portfolio, etc. stored on profile |
| Socials visibility | **Default public** to **signed-in** viewers; user may mark individual socials **private**. Signed-out viewers never see socials — see auth.md |

### 2.4 Auth0 moment
Sign-in for **chat** and to see names/nicknames (auth.md). Merge anon session + any resume-drafted fields.

### 2.5 Candidate UX intent
1. Link/code → event (+ timeline if present)  
2. Fast card: looking, skills, role, experience, desired team size (± org affiliation)  
3. Optional: upload resume → agent proposes profile/socials → confirm  
4. Browse / like; Google sign-in when chatting  

**Manual time budget:** ≈ 60–90 seconds without resume.

### 2.6 When min profile is required (C6 — locked)
**A. Join event CTA** — “Join” collects minimum fields before they count as a participant. Event page remains viewable without joining.

---

## 3. Locked answers (Q&A)

| ID | Decision |
|----|----------|
| O1 | Venue address optional; **TBA OK** |
| O2 | **Max team size required**; set by org |
| O3 | **Force ≥ 1 track** at event create |
| O4 | Nothing else mandatory for now |
| C1 | Skills: **both** chips + free tags |
| C2 | Role: **single** |
| C3 | Experience: 3 bands OK |
| C4 | Optional **organization** (not school-only) |
| C5 | Nickname **always editable** |
| C6 | **A** — min profile on **Join event** |
| C7 | **Yes** — ask desired team size |
| S1 | Socials visible to **signed-in only**; never signed-out |
| Socials default | **Public** (opt-out to private per link) |
| New | Event **timeline** supported |
| New | Optional **resume parse agent** fills profile + socials |

---

## 4. Deferred
Forced resume, multi-login providers, recommendation engine, sponsorship/judging modules.
