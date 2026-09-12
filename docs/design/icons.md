# Icons

Two animation libraries, one stroke language, and a rule that keeps them from overlapping.

---

## 1. Base geometry

Everything is **Lucide**. Both libraries build on it, which means there is one set of proportions, one stroke weight convention, and one visual language across the product.

| Size | Stroke | Use |
|------|--------|-----|
| 16px | 1.75 | Inline with `body-s` and `label` |
| 20px | 1.5 | Default — buttons, list items, nav |
| 24px | 1.5 | Icon buttons, empty states |

Stroke goes **up** at 16px, not down. A 1.5 stroke at 16px renders thin and greys out against a black ground; 1.75 holds.

Icons inherit `currentColor`. They are never colored except inside a danger or success signal, and never colored decoratively ([color.md rule 3](color.md#the-seven-rules)).

---

## 2. The division

This is the rule. It exists because both libraries can technically do the same job, and a product where the choice is made per-component ends up feeling arbitrary.

> **Morphicons** when a control has **two states** and the morph shows *what changed*.
> **animate-ui** when the icon **is the affordance** and the animation is feedback on an action with no second state.
>
> Never both on the same icon. Never animate an icon that is not interactive.

---

## 3. Morphicons

[morphicons.com](https://www.morphicons.com/) — spring-physics morphing between any two stroke icons. Zero runtime dependencies, ~6.5KB gzipped.

```bash
npm install morphicons
```

```tsx
import { MorphIcon } from "morphicons/react";
import { Eye, EyeOff } from "lucide";

<MorphIcon icon={looking ? Eye : EyeOff} />
```

**Note the import.** Morphicons consumes the **`lucide`** package — raw icon *data* — not `lucide-react` components. Both will be installed, because animate-ui needs `lucide-react`. This is expected, not a mistake to clean up.

### Where

| Morph | Control |
|-------|---------|
| menu ↔ x | Nav open/close |
| eye ↔ eye-off | The Looking toggle; per-link socials privacy |
| radar ↔ radar-off | **Want to be found** (day-of finder opt-in) |
| heart ↔ heart-filled | Like |
| lock ↔ unlock | Track selection lock (organizer) |
| chevron-down ↔ chevron-up | Timeline expand |
| copy ↔ check | Share panel — copy link, copy code |

Presets: `smooth` for state toggles, `snappy` for copy→check.

The Looking toggle is the most important one in the product — it is the single control that determines whether a person appears in the list at all. An eye that opens is a better answer than a checkbox, because it says what the state *means* rather than that it is on.

---

## 4. animate-ui

[animate-ui.com](https://animate-ui.com/docs/icons) — Lucide icons animated with Motion. A shadcn-style registry: components are **copied into the repo**, not imported from a package, so they land in `@/components/animate-ui/icons/*` and can be edited.

Peer dependencies: `motion`, `lucide-react`. Installed through the shadcn CLI — **check the current registry URL in the docs at install time** rather than assuming the command.

### Where

| Icon | Action |
|------|--------|
| bell | A like ping arriving |
| refresh / loader | Looking list refresh, map re-locate |
| send | Send a chat message |
| share | Share panel open |
| map-pin | Day-of presence |

### Props

| Prop | Rule |
|------|------|
| `animateOnTap` | Default for actions |
| `animateOnHover` | **Desktop only.** This product is mobile-first; hover must never be the only feedback an action gives |
| `loop` | Loading and pending states only. Never decoration |
| `size` | From the scale in §1 — 16, 20, 24 |

---

## 5. Restraint

**Animate only what responds.** A map pin marking a location is a static icon. A map pin that re-centres the map when tapped is an animate-ui icon. The animation is the feedback, so an icon that gives no feedback should not have one.

**One animated icon per moment.** If a card has a like, a share and a report, only the like — the primary action — animates. Three animating icons in one card is a toy.

**No decorative iconography.** Icons appear as affordances or as status. Not next to headings, not as section markers, not as bullets.

**Everything works static.** Under `prefers-reduced-motion`, morphs cross-fade and animate-ui icons render their end state ([motion.md §6](motion.md#6-reduced-motion)). If an icon only communicates while animating, it was the wrong icon.
