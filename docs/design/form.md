# Form

Radius, space, layout, and how elevation works without shadows.

---

## 1. Radius

Radius **encodes surface weight**. It is not one value applied to everything — identical rounding on chips, cards and modals is the visual signature of a component kit, and it throws away a free channel of hierarchy.

| Token | Value | Applies to |
|-------|-------|------------|
| `--r-0` | 0 | Dividers, the field canvas, table rows, the map, anything full-bleed |
| `--r-1` | 6px | Inputs, skill chips, small toggles, tooltips |
| `--r-2` | 10px | Buttons, segmented controls |
| `--r-3` | 16px | Person cards, event cards, list items |
| `--r-4` | 24px | Modals, bottom sheets, Tier 2 field panels |
| `--r-full` | 9999px | Avatars, the Looking toggle, the Like pill, counters |

### Two rules that make it a system

**Concentric nesting.** An inner element's radius is the outer radius minus the gap between them.

```
card      --r-3  (16px)
  padding        10px
  chip    --r-1  (6px)     16 − 10 = 6  ✓
```

This is why the scale has the values it has. Mismatched curvature between a container and its contents is subtle and reads as sloppiness without being nameable.

**Full-bleed is always `--r-0`.** Light has no corners. The field never rounds where it meets a viewport edge; it takes `--r-4` only when it is a contained panel. The reference confirms it — a full-bleed letterbox with square corners.

---

## 2. Space

4px base:

```
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
```

No arbitrary values. If a gap needs 18px, the layout is wrong somewhere above it.

Common assignments:

| Gap | Between |
|-----|---------|
| 4 | Icon and its label |
| 8 | Chips in a row, stacked meta lines |
| 12 | Form label and its input |
| 16 | Card padding, list item padding |
| 24 | Cards in a list, form fields |
| 32 | Sub-sections |
| 48 | Sections on mobile |
| 96 | Sections on desktop |

---

## 3. Layout

**Mobile-first, genuinely.** Candidates arrive from a QR code or a Discord link, on a phone, standing up, possibly in a queue. The phone layout is the design; desktop is the adaptation.

| Breakpoint | Width | Columns |
|------------|-------|---------|
| base | 0–479 | 4 |
| sm | 480 | 4 |
| md | 768 | 8 |
| lg | 1024 | 12 |
| xl | 1280 | 12 |

Gutter 20px throughout. Side margin 20px on mobile.

### Containers

| Container | Max width | Use |
|-----------|-----------|-----|
| Reading | 720px | Event description, profile, onboarding forms |
| List | 1120px | Looking list, people grid, chat |
| Dashboard | 1440px | Organizer dashboards only |
| Full | none | The field, the day-of map |

Organizer dashboards are the only surface allowed to assume a desktop, because organizers are the only users running one at a laptop. Candidate flows never get a desktop-only layout.

---

## 4. Elevation without shadow

There are no shadows in this system. On a `#000000` ground a drop shadow is either invisible or an obvious fake, and stacking soft grey shadows under identical rounded cards is the most recognisable component-kit texture there is.

Elevation is two things instead:

**A luminance step.** `--void` → `--surface` → `--raised`. Something that floats is lighter, which is also literally how light works.

**A dithered hairline.** A Tier 3 edge ([field.md §5](field.md#5-three-tiers)) around the raised surface. This is the detail that ties an ordinary card back to the identity — the same dither language as the header, at 1px.

| Level | Background | Edge |
|-------|------------|------|
| Page | `--void` | — |
| Card | `--surface` | Tier 3 hairline |
| Raised / hovered | `--raised` | Tier 3 hairline |
| Modal, sheet | `--surface` | Tier 3 hairline + full-screen scrim `rgba(0,0,0,.6)` |

**One card depth.** No cards inside cards. If content inside a card needs separation, use a `--line-quiet` rule and spacing, not another surface.

---

## 5. Controls

Sizes, so touch targets are settled once.

| Control | Height | Radius | Min touch target |
|---------|--------|--------|------------------|
| Button, large | 48px | `--r-2` | 48×48 |
| Button, default | 40px | `--r-2` | 44×44 with padding |
| Input | 44px | `--r-1` | 44×44 |
| Chip | 32px | `--r-1` | 44×44 with padding |
| Icon button | 40px | `--r-2` | 44×44 |
| Toggle | 28×48 | `--r-full` | 44×44 |

**Minimum touch target is 44×44 everywhere**, expanded with padding where the visual control is smaller. A 32px chip in a skills list still gets a 44px hit area — people tap these with a thumb while walking.

---

## 6. The field as layout

Where a Tier 1 field is present, it changes the layout rules for that surface:

- Content is **centred**, because the field is symmetric about its waist ([type.md §6](type.md#6-alignment)).
- The primary text sits **at the waist**, which is the darkest region ([field.md §7](field.md#7-legibility)).
- The canvas is full-bleed and square-cornered, `--r-0`.
- Nothing else competes: a field surface carries a wordmark or a heading, a line of supporting text, and at most one action. Dense content belongs on the surfaces below it.
