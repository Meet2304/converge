---
name: frontend-design
description: Design and build distinctive, production-grade UI for Converge — the Next.js hackathon team-formation web app. Use when creating or restyling any page, screen, component, empty state, or interface copy (event page, Join, looking list, likes/match, teams and chat, day-of map and finder), when choosing typography, color, or layout, or when the user asks to design, beautify, polish, or lay out anything visual.
---

# Frontend design for Converge

Work as the design lead for a product whose whole promise is that it feels less like Discord and more like a place. Converge is used twice: calmly, days before an event, on a phone in bed; and urgently, on the venue floor, one-handed, in bad light, while walking. Those two moods are the design problem. Solve them specifically — do not produce the interface you would produce for any other social app.

## Before designing anything

1. Read `docs/vision.md`, then `docs/INDEX.md`, then only the source-of-truth docs for the section IDs you are touching (`docs/auth.md`, `docs/onboarding.md`, `docs/pre-hackathon.md`, `docs/day-of.md`). Section IDs used below, like `5.1` or `6.6`, are INDEX entries.
2. Locked docs win over your aesthetic instinct, over chat history, and over this skill. If good design seems to require breaking a locked rule, say so and ask — do not silently diverge.
3. Check `AGENTS.md` for current constraints and whether the item you are designing is marked deferred (`[D]`) or pending credentials (`[P]`).
4. If a doc named here is missing from the checkout, it exists in the project's doc set but has not been synced — ask for it rather than inventing the rule it holds.
5. Note which surface you are in. Candidate surfaces are mobile-first. Organizer surfaces are desk-first and can be denser.

## Pass 1: write the design plan, then interrogate it

Never open with code. Write a compact plan first:

- **Color** — 4–6 named hex values, with the role of each (surface, ink, accent, warning, map overlay). State how they behave over a live map, which is the hardest background in this product.
- **Type** — one or two families, with roles. If two, make them unmistakably different.
- **Layout** — a one-sentence concept plus an ASCII wireframe per key breakpoint. State alignment intent.
- **Principles** — three or four lines on what makes this surface specific to Converge rather than to social apps in general.

Then review the plan against the brief. Ask yourself what you would have produced from a generic prompt like "design a team-matching app screen." Anything your plan shares with that imagined output is a default, not a decision — revise it, and say what you changed and why. Only then write code, following the revised plan.

## Defaults to avoid

These read as generated, regardless of subject:

- Warm cream (near `#F4F1EA`) with a high-contrast serif display and a terracotta accent (near `#D97757`).
- Near-black canvas with one acid-green or vermilion accent.
- Purple or blue-violet gradients on white.
- The SaaS-card kit: every block chopped into identically rounded cards with the same soft grey shadow, gradient washes used as decoration.
- Template chrome: tracked-out ALL-CAPS eyebrow labels above every heading, meta strings joined by middle dots, `WORD — fragment` labels, monospace for small data, `→` glued onto button text.
- One word in a headline italicized, bolded, or recolored for emphasis.
- Numbered markers (01 / 02 / 03) on content that is not actually a sequence. Converge has two real sequences — the event timeline and the Join steps — and almost nothing else.

Converge-specific tells to avoid: dating-app styling for likes and matches (swipe decks, heart confetti, "hot or not" framing); avatar grids that imply ranking when the locked sort is most-recent; map UI that looks like a ride-hailing app.

## Structure, motion, and the map

- Structural devices (rules, borders, labels, badges) must encode information: who is signed in, who is looking, how many seats a team still needs, whether location is live. Decoration that carries no state gets cut.
- The event page is one continuous scroll (`5.1`). Do not introduce tabs, wizards, or accordions that break it.
- Non-user-triggered motion is rationed. One orchestrated moment is allowed per surface; the match reveal (`5.6`) is the strongest candidate in the whole product, so spend it there rather than on per-card hover and per-section fade-ups.
- Motion that answers an action — joining, liking, sending, dropping a pin, going live — should show what changed.
- Day-of is map-first and full-screen when the organizer enables location (`6.1`). Chrome floats over the map; keep it thumb-reachable, legible in direct sunlight, and honest about GPS uncertainty. Indoors, coarse location plus warmer/colder is the truth — design for imprecision instead of implying a blue-dot the data cannot support.

## Privacy is a visual constraint, not a settings page

The interface must make the access tier obvious at a glance, because the rules are real:

- Signed-out viewers see anonymized profiles, never names, PII, or socials (`2.7`, `2.8`, `5.7`). Design the anonymized state as a deliberate state with its own visual language — not as a blurred or broken version of the signed-in card.
- Socials are visible to signed-in viewers by default, with a per-link private opt-out (`2.10`). The opt-out has to be visible where the link is, not buried.
- Teamed users see teammates only on the map; team pins stay inside the team (`6.5`). Never render a UI that implies broader visibility.
- Location requires Join first (`6.2`), and the finder additionally requires "want to be found" (`6.6`). Show the gate and what unlocks it, in that order.
- Outside the geofence buffer a user goes invisible (`6.10`). Make that state unmistakable to the person it affects.

## Words

Copy is design content. Keep the locked journey vocabulary exactly — **Join**, **Looking**, **Match**, **Team**, **Find**, **Want to be found** — and use each term for one concept only, across buttons, toasts, empty states, and notifications.

- Active voice, sentence case, no filler. A button says what happens: "Share location," not "Continue."
- An action keeps its name through the flow: "Join" produces "You joined," not "Registration complete."
- Name things as the attendee understands them, not as the system is built: "Someone liked you," not "anonymous like record created."
- Empty states are invitations with one clear next action: nobody looking yet, no likes yet, map off until the organizer enables it, team needs N more.
- Errors state what happened and how to fix it. They do not apologize and they are never vague — location denied, event code not found, team already full.

## Quality floor

Build to this without announcing it: responsive down to small phones with safe-area insets respected, visible keyboard focus, `prefers-reduced-motion` honored, text and map overlays meeting contrast in outdoor light, touch targets comfortable one-handed, and no layout that depends on hover alone. In-app notifications only — there is no email or push in the MVP (`5.5`, `6.9`).

Critique as you build. Screenshot your own work if the environment allows it; a picture is worth a thousand tokens. Before you call it done, remove one accessory.

## Stay inside open decisions

The UI kit is a lean, not a lock: shadcn/ui plus Tailwind is the current proposal in `docs/stack.md` (S8) and is not decided. Do not present a library or a design system as locked, and do not scaffold a theme so opinionated that switching kits means redesigning. Keep tokens (color, type, spacing, radius) in one place so the visual identity survives a kit change.

---

Provenance: this skill adapts the publicly documented practice of Anthropic's open `frontend-design` skill to Converge's locked product docs. Where the two disagree, Converge's docs win.
