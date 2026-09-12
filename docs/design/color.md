# Color

Converge is black and white. Hue exists, but only where nothing else will do the job.

---

## 1. The luminance ladder

Not a palette — a ladder of light. Every value is zero-chroma, so the only thing that varies is how much light there is.

### Ground

| Token | Value | Use |
|-------|-------|-----|
| `--void` | `#000000` | Page background, the field's ground |
| `--surface` | `#101010` | Cards, sheets, list rows |
| `--raised` | `#1A1A1A` | Inputs, hovered rows, active segments |

**Black is `#000000`.** Not `#0B0B0B`, not `#111`. Two reasons: a tinted near-black is the commonest tell of a generated interface, and more importantly it breaks the field — beams have to read as *emitted* light, and light emitted onto dark grey reads as printed ink instead.

### Text

| Token | Value | Contrast on `--void` | Use |
|-------|-------|----------------------|-----|
| `--text-1` | `#F2F2F2` | 18.8:1 | Primary text, headings, wordmark |
| `--text-2` | `#A8A8A8` | 8.8:1 | Secondary text, meta, captions |
| `--text-3` | `#787878` | 4.8:1 | Tertiary — **the AA floor** |
| `--text-4` | `#5A5A5A` | 3.0:1 | Disabled and decorative only — never carries text a user must read |

Primary text is `#F2F2F2`, not `#FFFFFF`. Pure white on pure black glares and causes halation at large sizes, and the reference wordmark is visibly off-white — that is not an accident of export, it is the correct choice.

Nothing below `--text-3` carries information. `--text-4` is for disabled controls and rules.

### Lines

| Token | Value | Use |
|-------|-------|-----|
| `--line-quiet` | `rgba(255,255,255,.07)` | Internal rules inside a card |
| `--line` | `rgba(255,255,255,.14)` | Card edges, input borders, dividers |
| `--line-loud` | `rgba(255,255,255,.28)` | Active and selected states |

Lines are alpha, not solid greys, so they compose correctly over `--surface`, over `--raised`, and over the field.

Wherever budget allows, a line should be a **Tier 3 dithered hairline** rather than a flat alpha ([field.md §5](field.md#5-three-tiers)). Flat alpha is the fallback, not the default.

---

## 2. Hue

Two values exist. They are instruments, not a palette.

| Token | Value | Contrast on `--void` | Meaning |
|-------|-------|----------------------|---------|
| `--danger` | `#FF4438` | 6.1:1 | Destructive, error, moderation |
| `--success` | `#35D68A` | 11.1:1 | Confirmed, mutual, formed |

### The seven rules

**1. Hue appears in exactly three places.** Destructive actions (report, suspend, ban, delete event), validation errors, and confirmed state (joined, match, team formed). Nowhere else.

**2. Hue never enters the field.** The field outputs `vec3(q)` — greyscale, always. This is the rule that keeps the identity monochrome no matter what happens elsewhere.

**3. Hue is never brand.** Not on links, not on hover, not on focus rings, not on primary buttons, not on charts, not on decoration. The accent of this product is white light.

**4. Hue is never a large fill.** Maximum is a chip or an inline banner. A destructive button is `--danger` text with a `--danger` hairline; it fills only on the final confirm step, where the fill is the point.

**5. Every hue signal is redundant.** Icon plus text, always. Remove all color from the interface and nothing becomes ambiguous. This is an accessibility requirement and a design test at the same time — if a state only works in color, it was not designed.

**6. Budget: ≤2% of pixels.** On any screen. If hue exceeds that, something has become decorative and should be reverted to luminance.

**7. The moderation ladder is luminance, not four colors.** `warned` is `--text-2` with an icon. `suspended` is dimmed to `--text-4` and struck through. `banned` is `--danger`. Escalation reads as *fading out of the event*, which is what is actually happening, and only the final step earns hue.

### Backgrounds for hue

When a hue needs a surface — an error banner, a success toast — use a low-alpha tint of the hue itself over `--surface`, never a solid:

| Token | Value |
|-------|-------|
| `--danger-quiet` | `rgba(255,68,56,.12)` |
| `--success-quiet` | `rgba(53,214,138,.12)` |

---

## 3. Buttons

Stated here because button color is where systems leak.

| Variant | Fill | Text | Border |
|---------|------|------|--------|
| Primary | `--text-1` | `--void` | none |
| Secondary | transparent | `--text-1` | `--line` |
| Quiet | transparent | `--text-2` | none |
| Destructive | transparent | `--danger` | `--danger` at 40% |
| Destructive, confirming | `--danger` | `--void` | none |

The primary button is **white** — maximum light, consistent with a system whose accent is light. A colored primary button would make hue the brand and break rule 3.

---

## 4. Focus

```css
outline: 2px solid var(--text-1);
outline-offset: 2px;
```

White, never colored, never removed. On a black ground a white ring is the highest-contrast indicator available, and keeping it achromatic means focus never competes with a danger or success signal that happens to be on screen.

`:focus-visible` for pointer users, but never suppress the ring for keyboard.

---

## 5. Contrast reference

Every combination that appears in the product, verified against WCAG 2.1 AA.

| Foreground | Background | Ratio | Verdict |
|------------|------------|-------|---------|
| `--text-1` | `--void` | 18.8:1 | AAA |
| `--text-2` | `--void` | 8.8:1 | AAA |
| `--text-3` | `--void` | 4.8:1 | AA — floor for body text |
| `--text-4` | `--void` | 3.0:1 | Non-text / disabled only |
| `--danger` | `--void` | 6.1:1 | AA |
| `--success` | `--void` | 11.1:1 | AAA |
| `--void` | `--text-1` | 18.8:1 | AAA — primary button |

Over the field, contrast is governed by [field.md §7](field.md#7-legibility): background luminance under body text never exceeds 0.35, which keeps `--text-1` above 7:1 in the worst case.
