# Type

Three faces, three jobs, no overlap.

| Face | Job | Never used for |
|------|-----|----------------|
| **Kanit** | Headings and display. The voice. | Anything below 16px |
| **Schibsted Grotesk** | Everything a person reads or fills in | Display sizes |
| **Martian Mono** | Values that get counted or transcribed | Labels, prose, headings |

---

## 1. Why these three

**Kanit** (Cadson Demak, OFL) is semi-condensed, squarish and engineered. At weight 200 and very large it stops looking like a typeface and starts looking like the light in the field — thin, wide-set, optical. That is the whole reason it is here.

Its weakness is the same as its strength: it is narrow with tight apertures, so it goes muddy at interface sizes on a phone. Hence the floor in §3.

**Schibsted Grotesk** (OFL) is a Nordic screen grotesque with angled-cut terminals and open apertures — cool and precise rather than friendly, which matches the field's mood, and built for interface text, so it holds at 13–15px on a 400px-wide screen. It is noticeably wider and more open than Kanit, which is what makes the pairing read as two deliberate voices instead of one face at two sizes.

**Martian Mono** (OFL) is squarish and wide. It echoes Kanit's engineered geometry while contrasting hard in width, and its unambiguous `0`/`O` and `1`/`l` matter for a product that asks people to read an event code off a projector screen and type it into a phone.

The width progression — narrow Kanit, normal Schibsted, wide Martian — is the structural idea holding the three together.

---

## 2. Loading

Kanit on Google Fonts is a **static** family: 9 weights × 2 styles = 18 files. Do not load the family.

Self-host via `next/font/local` with exactly what is used:

| Face | Weights | Styles |
|------|---------|--------|
| Kanit | 200, 400, 600 | Roman only |
| Schibsted Grotesk | 400, 500, 700 | Roman only |
| Martian Mono | 400 | Roman only |

**Subset to `latin`.** Kanit ships a full Thai character set, which is a large share of its file size and is not needed. OFL permits subsetting.

No italics anywhere in the system by default. Kanit's italic is a genuinely good design, but there is no job in this product that needs it, and an italic that exists gets used decoratively.

---

## 3. Scale

1.25 modular for interface sizes; display breaks out of the scale because it is doing a different job.

| Token | Size / line-height | Face | Tracking | Use |
|-------|--------------------|------|----------|-----|
| `display-xl` | `clamp(44px, 9vw, 96px)` / 0.95 | Kanit 200 | −0.035em | Event header, wordmark |
| `display-l` | 64 / 1.0 | Kanit 200 | −0.03em | Join screen, match |
| `display-m` | 44 / 1.05 | Kanit 200 | −0.025em | Section openers |
| `heading-l` | 30 / 1.15 | Kanit 400 | −0.015em | Modal titles, event name in a list |
| `heading-m` | 22 / 1.25 | Kanit 400 | −0.01em | Card titles |
| `heading-s` | 16 / 1.3 | Kanit 600 | 0 | Small headings, buttons |
| `body-l` | 17 / 1.55 | Schibsted 400 | 0 | Event description |
| `body` | 15 / 1.55 | Schibsted 400 | 0 | Default |
| `body-s` | 13 / 1.5 | Schibsted 400 | 0 | Card meta, captions |
| `label` | 13 / 1.2 | Schibsted 500 | 0 | Chips, form labels, nav |
| `code-l` | 24 / 1.1 | Martian Mono 400 | +0.02em | Event code display |
| `code` | 14 / 1.4 | Martian Mono 400 | +0.01em | Distances, timestamps, counts |

---

## 4. Rules

**Kanit never renders below 16px.** Not in a chip, not in a button, not in a table header, not "just this once." Below 16 the job passes to Schibsted 500. This is the single rule most likely to be broken by accident and most damaging when it is — on a 390px phone screen, small Kanit is the difference between a product that looks considered and one that looks blurry.

**Tracking is negative and scales with size.** Large type needs less space between letters, not more. The only positive tracking in the system is Martian Mono, which needs air when a string is being read character by character.

**Measure ≤68 characters** for Schibsted body text. Sans-serif at 1.55 line-height, so tighter than the usual 80-character ceiling.

**Martian Mono is for values, not labels.** `H4K-92QX`, `~30m`, `14:20`, `4/6`. The word "distance" next to it is Schibsted. Mono used as a texture for small labels is template chrome, not information design.

**No ALL-CAPS.** Not for labels, not for eyebrows, not for buttons. Kanit's capitals are strong enough that all-caps reads as shouting, and the system has no job that needs it.

**No eyebrow labels above headings.** If a heading needs a category above it, the heading is not doing its job.

**No single-word accenting** in a heading — no italic, bold or colored word to create emphasis. Emphasis comes from the scale.

---

## 5. The wordmark

"Converge", Kanit, tracking −0.03em, placed at the field's waist.

**Optical weight switch:** weight **200 above 40px**, weight **400 below**. At small sizes a 200 weight disappears; the reference wordmark is regular weight for exactly this reason, and it is worth matching rather than treating as a compromise.

| Constraint | Value |
|------------|-------|
| Clear space | cap-height × 2 on all sides |
| Minimum size | 18px |
| Placement on the field | At the waist — the darkest region, per [field.md §7](field.md#7-legibility) |
| On light backgrounds | Inverted to `--void`; never a grey wordmark |
| Field luminance behind it | ≤0.35 |

Never letterspace the wordmark positively, never set it in another face, never lock it up with a tagline.

---

## 6. Alignment

**Left, everywhere, with one exception.**

Lists, profiles, forms, cards and dashboards are scanned down a left edge — centering them costs scanning speed for nothing.

The exception is **field moments**: the event header, the join screen, match, and the finder. These centre because the field is symmetric about its waist, and centring puts the type exactly at the convergence point. The reference does this, and it is the reason it works.

Never justify text.
