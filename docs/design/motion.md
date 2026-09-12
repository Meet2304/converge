# Motion

Two domains that must not be confused.

**Field motion** is continuous and physical — GPU, damped by time constants, no easing curves, no durations. It models light.

**Interface motion** is discrete — CSS or Motion, duration plus easing, triggered by a state change. It explains what happened.

Keeping them separate is what stops the interface feeling like the shader and the shader feeling like a widget. Field motion is specified in [field.md §3](field.md#3-pointer-response). This document covers the interface.

---

## 1. Easing

Derived from the brand rather than picked off a list: light arrives fast and settles slowly.

| Token | Curve | Use |
|-------|-------|-----|
| `--ease-settle` | `cubic-bezier(.16, 1, .3, 1)` | Default. Entrances, state changes, anything arriving |
| `--ease-exit` | `cubic-bezier(.4, 0, 1, 1)` | Exits — accelerate away and leave |
| `--ease-cross` | `cubic-bezier(.4, 0, .2, 1)` | Moving A→B without appearing or disappearing |

`--ease-settle` has a long tail: it covers most of its distance early and then eases in for a long time. That is what makes a panel feel like it settled rather than stopped.

Never `ease`, `ease-in-out`, or `linear` — except `linear` for a continuously rotating loader, where any other curve looks broken.

---

## 2. Duration

| Token | ms | Use |
|-------|----|-----|
| `--t-1` | 120 | Hover, focus ring, chip select, icon tap feedback |
| `--t-2` | 200 | Toggle, checkbox, button press, tooltip |
| `--t-3` | 320 | Card expand, panel open, list reorder |
| `--t-4` | 480 | Route change, bottom sheet, match reveal |

**Exits run one step shorter than their entrance.** A sheet that enters at `--t-4` leaves at `--t-3`. Waiting for something to leave is dead time; waiting for something to arrive is anticipation.

---

## 3. Rules

**Animate `opacity` and `transform` only.** Never `height`, `width`, `top`, `left`, or anything else that triggers layout. For size changes use `grid-template-rows: 0fr → 1fr`, or FLIP for reordering.

**One orchestrated moment per route.** On the event page it is this, once, on load:

```
0ms     field begins resolving from flat black toward its convergence value
300ms   wordmark fades up
900ms   field settles
```

Everything else on the page is simply present when the page is. No section-by-section fade-and-slide on scroll — that is not a design decision, it is a default, and it makes every page feel the same as every other page on the internet.

**Motion answers actions.** A card expanding, a sheet opening, a toggle flipping, a like registering — these earn animation because they show what changed. Nothing animates to announce itself.

**Stagger: maximum 5 items at 40ms.** Beyond 5 items, no stagger at all. A 20-item staggered list takes 800ms to finish arriving and reads as slow, not as polished.

---

## 4. Springs

For anything that follows a pointer, gets dragged, or should feel physical. Motion's spring, not a duration.

| Spring | Config | Use |
|--------|--------|-----|
| House | `{ stiffness: 220, damping: 30, mass: 1 }` | Drag, pointer-following, sheet handles |
| Arrival | `{ stiffness: 140, damping: 26, mass: 1 }` | Match — slight overshoot, so it lands like an event |

The arrival spring is the only place in the system permitted to overshoot. Overshoot everywhere is bounciness; overshoot in one place is emphasis.

---

## 5. The named moments

Four moments in the product carry weight. Everything else is plumbing.

**Join completes.** Field converges from its current value to the event's real convergence over `--t-4`. The Looking toggle animates on. No confetti, no modal.

**Like sent.** Field pulses to `0.7` and settles to `0.55` with τ 0.9s ([field.md §3.1](field.md#31-damping-is-the-entire-feel)). The heart morphs ([icons.md](icons.md)). That is all — a one-way like is a small thing and should feel small.

**Match.** Field runs to `0.95` on the arrival spring, waist brightens, `display-l` text arrives at `--t-4`.

**Team formed.** The payoff, and the only place the field does something beyond moving. Four movements: the beams **close** slowly (waist damping scaled 1.8×), the field **gathers** inward and darkens, then **releases** — falloff flattening, gain lifting, halo carrying light out to the frame edges — and finally **holds**, breathing at ±6% over 9 seconds. Attack 0.32s, decay 2.2s.

The staging is what makes it majestic rather than merely loud. A single flash of the same amplitude reads as a notification; a sequence with anticipation in it reads as an event.

Spec and reasoning in [field.md §4.2](field.md#42-team-formed--the-bloom), including why it is deliberately not an expanding ripple. Nothing else in the product gets a treatment like this, which is the point — a team existing is what Converge is for.

**Finder closing.** Continuous, not discrete — field convergence tracks `1 − distance/max` with τ 0.9s, forever, while the finder is open. No transition, no states. It breathes.

---

## 6. Reduced motion

`@media (prefers-reduced-motion: reduce)`:

| Thing | Behaviour |
|-------|-----------|
| Field | Renders one frame at its current convergence and freezes. State changes cross-fade the frame over 200ms |
| Team-formed sequence | Off — close, gather, release and breathe all skipped. Convergence `1.0` is a fused column with or without them, so the state still reads |
| Temporal shimmer | Off |
| Mobile autonomous drift | Off |
| `--t-1`, `--t-2` | 0ms |
| `--t-3`, `--t-4` | 120ms, opacity only, no transform |
| Springs | Replaced by the 120ms opacity transition |
| Morph icons | Cross-fade instead of morphing |
| animate-ui icons | Render their static end state |
| Loaders | Keep spinning — a frozen loader reads as a hang |

A frozen field still looks like the reference, because the reference is a still image. This design costs almost nothing under reduced motion, which is a good sign about the design.

Loaders are the deliberate exception: `prefers-reduced-motion` means *reduce*, not *remove*, and removing the only indication that something is happening is worse for everyone.
