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

- [ ] **Design system** — foundation written, pending sign-off ([docs/design/](docs/design/README.md))
  - Locked: Kanit / Schibsted Grotesk / Martian Mono; true `#000` with hue only where functional; `ign` dither; field convergence carries product state
  - The field is isolated in [field-renderer.js](docs/design/proof/field-renderer.js) — dependency-free ES module, ready to import
  - Tune by eye in [proof/field.html](docs/design/proof/field.html) (`cd docs/design && npx serve`)
  - Open before build: Tier 2 / Tier 3, baked fallbacks, text scrim ([field.md §12](docs/design/field.md))

## Next

- [x] **Next.js skeleton** — App Router + Tailwind + shadcn (bun) — Phase 1.1
- [ ] **Auth0 wiring** — Google login + stable anon session merge
- [ ] Wire Grok APIs when credentials arrive (nickname + Imagine avatar)

## Explicitly deferred

Recommendation / ranking / smart matching; native apps; Discord megaphone replacement.
