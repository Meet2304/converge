# UI kit

**shadcn/ui + Tailwind v4**, per [stack.md](../stack.md) and INDEX 1.8.

The kit is for chat, dashboards, forms, sheets and dialogs — the chrome. It is not the visual language. Where the two disagree, [the design system wins](README.md).

---

## 1. What had to be restyled

The scaffold arrived as stock shadcn, whose defaults are close to the opposite of this system. None of it could be used as shipped.

| Default | Why it breaks | What replaced it |
|---|---|---|
| `oklch(0.145 0 0)` dark background | A tinted near-black. The field's beams have to read as *emitted* light; on dark grey they read as printed ink | True `#000000` |
| One `--radius: 0.625rem` | Radius carries no information when everything shares it | The six-step scale from [form.md §1](form.md), with `--radius` mapped to `--r-3` |
| `shadow-sm` on cards and popovers | On a `#000` ground a drop shadow is invisible or an obvious fake | All `--shadow-*` theme values zeroed. Elevation is a luminance step plus a hairline |
| Kanit as `--font-sans` | Kanit is semi-condensed with tight apertures and goes muddy below 16px on a phone | Kanit is display only; Schibsted Grotesk carries text |
| Geist Mono | Not the locked face | Martian Mono, for codes and distances only |
| `uppercase tracking-[0.2em]` eyebrow | The commonest tell of a generated page | Removed |

Zeroing the shadow *values* rather than banning `box-shadow` is deliberate: Tailwind's focus rings are box-shadow based, and they have to keep working.

---

## 2. Token wiring

Everything lives in [`src/app/globals.css`](../../src/app/globals.css), in one place, so the identity survives a kit change:

- **Design tokens** — `--void`, `--surface`, `--raised`, `--ink-1…4`, `--line*`, `--danger`, `--success`, `--r-0…4`, `--ease-*`, `--t-1…4`.
- **shadcn semantic mapping** — `--background`, `--card`, `--primary`, `--border`, `--ring` and friends all point at design tokens rather than holding values of their own. Change a token, and every shadcn component follows.
- **Type scale** — `.display-xl` through `.code`, as classes, so no component has to remember a size/weight/tracking triple.

`:root` and `.dark` carry the same values. Converge is dark-only, so there is no light-mode flash before the class lands.

---

## 3. Rules

**Restyle through tokens, not per component.** If a shadcn primitive looks wrong, the token mapping is wrong. Reach for a per-component override only when the primitive hard-codes something.

**Don't scaffold a theme so opinionated that switching kits means redesigning.** Tokens stay in one file, and components read them.

**shadcn is not required for everything.** The landing page uses none of it — a code input and two buttons did not justify the indirection. Use the kit where it saves real work: chat, dashboards, sheets, dialogs, forms.

**Icons:** Lucide, per [icons.md](icons.md). Animate UI and Morphicons for motion, inside the motion budget in [perf-risks.md](../perf-risks.md) R15.
