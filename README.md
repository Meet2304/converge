<p align="center">
  <img src="docs/assets/converge-header.png" alt="Friends finding each other at a hackathon" width="100%" />
</p>

<h1 align="center">Converge</h1>

<p align="center">
  <strong>Form hackathon teams without awkward Discord cold-DMs.</strong>
</p>

---

Finding teammates shouldn’t mean spamming channels or hoping the right person sees your message. **Converge** is a web app for hackathon team formation: show up with a light profile, connect before the event, and find each other on a live map when you’re on site.

## What it is

A simpler path from “I need a team” to “we’re meeting by the coffee table”:

1. **Join an event** with a short profile — skills, role, what you’re looking for  
2. **Connect before day-of** — browse who’s looking, like people, match, chat, and form a team  
3. **Find each other on site** — when organizers turn on the map, meet up with a live map and finder (with strong privacy for teams)

No install required to join. Organizers share a link or event code; attendees open it in the browser.

## Who it’s for

| | |
|---|---|
| **Attendees** | Join fast, get found or find others, form a team, meet up at the venue |
| **Organizers** | Create and share an event, set team size and tracks, open looking / map when you’re ready |

## How it works (in plain terms)

- **Before the event** — One event page you can scroll. See who’s looking (names stay private until you sign in). Like people you’re interested in; if it’s mutual, you get a clear match and can chat. You can form a team and use a group chat before doors open.
- **Day-of** — If the organizer enables location, the experience goes map-first: see the right people under the privacy rules (teammates when you’re on a team), use a finder to walk toward someone, drop meetup pins, and stay roughly at the venue.
- **Sign-in** — Browse anonymously first; Google sign-in unlocks chat and real names/socials when you’re ready to talk.

We’re **not** building a recommendation engine or another Discord. The goal is clearer presence and structured connect — then actually meeting in person.

## Status

Product definition through day-of is locked. **Next.js + Tailwind + shadcn skeleton is in-repo** (bun). Next: Auth0.

```bash
bun install
bun dev      # Next runs on Node via package scripts
bun run build
```

Vercel: install with bun `1.4.2` (see `vercel.json`); `build` is `next build` on Node (not `bun --bun`).


## Learn more

- [Product vision](docs/vision.md)  
- [Concept index](docs/INDEX.md)  
- [Pre-event experience](docs/pre-hackathon.md) · [Day-of map](docs/day-of.md)  
- [Design system](docs/design/README.md) — the look above, and how it's built

---

<p align="center"><em>Less channel hunting. More converging.</em></p>
