# Converge — status (2026-09-12)

Snapshot for agents working from this repo. Product detail lives under `docs/` and [AGENTS.md](AGENTS.md).

## Done

- [x] **Vision + agent entry** — [docs/vision.md](docs/vision.md), [docs/INDEX.md](docs/INDEX.md), [AGENTS.md](AGENTS.md)
- [x] **Auth (product rules)** — Auth0, Google-only MVP, progressive access ([docs/auth.md](docs/auth.md)); Grok nickname/avatar creds still pending
- [x] **Onboarding** — org + candidate fields locked ([docs/onboarding.md](docs/onboarding.md))
- [x] **Client medium** — web-first Next.js; no app gate ([docs/medium.md](docs/medium.md))
- [x] **Pre-hackathon UX** — locked ([docs/pre-hackathon.md](docs/pre-hackathon.md))
- [x] **Day-of UX** — locked, map-first ([docs/day-of.md](docs/day-of.md))
- [x] **Stack + snappiness** — Supabase / Vercel / Maps / Broadcast; perf budgets locked ([docs/stack.md](docs/stack.md), [docs/perf-risks.md](docs/perf-risks.md))
- [x] **Schema** — priorities + tables locked; applied to Supabase project `converge` (`cxhfmsnkcketqdlcqdic`, `us-east-1`) — [docs/schema.md](docs/schema.md)
- [x] **GitHub twin** — [Meet2304/converge](https://github.com/Meet2304/converge); keep in sync with Origin

## In progress

- [ ] **Design system** — wired into the app, pending sign-off ([docs/design/](docs/design/README.md))
  - Locked: Kanit / Schibsted Grotesk / Martian Mono; true `#000` with hue only where functional; `ign` dither; field convergence carries product state
  - Tokens live in [globals.css](src/app/globals.css); shadcn defaults restyled ([ui-kit.md](docs/design/ui-kit.md))
  - The field is [src/lib/field/renderer.js](src/lib/field/renderer.js) — one implementation, imported by both the app and the tuning harness
  - Tune by eye in [proof/field.html](docs/design/proof/field.html) (`npx serve` from the repo root)
  - Open before build: Tier 2 / Tier 3, baked fallbacks, text scrim ([field.md §12](docs/design/field.md))

- [ ] **Landing page** — built on the design system ([src/app/page.tsx](src/app/page.tsx))
  - Loader → Hero (code entry) → Find → Before → Organizations → Open source → Footer
  - One fixed field behind the whole page; scroll drives its convergence
  - **Blocker:** the open-source section claims AGPL-3.0 but there is no `LICENSE` file — add it via GitHub's licence picker before this ships
  - Open: event-code alphabet (exclude `0/O`, `1/I/l`), code-lookup rate limiting, organizer sign-in route, privacy/terms pages

## Next

- [x] **Next.js skeleton** — App Router + Tailwind + shadcn (bun) — Phase 1.1
- [ ] **Auth0 wiring** — Google login + stable anon session merge
- [ ] Wire Grok APIs when credentials arrive (nickname + Imagine avatar)

## Explicitly deferred

Recommendation / ranking / smart matching; native apps; Discord megaphone replacement.
