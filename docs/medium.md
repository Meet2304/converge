# Converge — Client medium (source of truth)

**Status:** Locked from product Q&A (web medium + Next.js stack).

## Locked decisions

| Decision | Locked |
|----------|--------|
| Primary client | **Web** (responsive; mobile-first for candidates) |
| Framework | **Next.js** |
| App-required to join | **No** |
| Native app (MVP) | **Out of scope** — revisit only if day-of GPS/push fails in web practice |
| Optional later | PWA “add to home”; thin native/Capacitor shell for map/finder if needed |

## Phase → surface

| Phase | Medium |
|--------|--------|
| Discover / join / browse / like / chat | Mobile web (shareable link / event code) |
| Return / home-screen | Optional PWA (not required) |
| Day-of map + finder | Same Next.js web first |
| Org dashboards | Web (desktop-friendly OK) |

## Rationale

- Episodic hackathon use + Discord/QR first touch favors open-link, zero-install.
- Progressive auth already assumes a browser funnel (view → join → Auth0 for chat/names).
- Team familiarity with Next.js; one codebase for org + candidate surfaces.
- Native is a later reward for live map quality, not the door to the product.

## Avoid early

- Desktop-only layouts for candidate flows
- App Store / Play Store as a join gate
- Separate org-app vs candidate-app products
