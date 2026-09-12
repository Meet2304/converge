# The Field

The dithered light field is Converge's identity. This document is the recipe and the rules for using it.

---

## 1. Why the reference looks like film

![The reference header](../assets/converge-header.png)

Look at where the grain lives. It is heaviest in the mid-luminance transitions, and it disappears both in the deep blacks and at the bright cores of the beams.

That is the signature of **dithering**, not of a grain overlay. A noise layer composited over a gradient is uniform across luminance — it sits on the blacks just as hard as on the midtones, and it reads as a filter applied to a picture. Dither noise is proportional to quantization error, so it vanishes wherever the smooth value already lands on a quantization step, and peaks halfway between steps.

This is the whole effect. **Quantize, then dither. Never composite grain on top.** Everything else in this document is detail.

---

## 2. The recipe

Rendered in a fragment shader, WebGL2, one full-screen triangle.

### 2.1 Coordinate space

Normalize by **height**, always, so vertical proportions are stable and the horizontal extent grows with the viewport:

```glsl
vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / (0.5 * uResolution.y);
// p.y spans [-1, 1]. p.x spans [-aspect, aspect].
```

On portrait viewports the lobes run off the sides, which is correct — you see the waist, which is the part that means something. Portrait uses a lower `uFlare` (see §6).

### 2.2 Beam field

Two mirrored beams whose axes are parabolas opening horizontally. They pinch to `uWaist` at the vertical centre and flare outward toward the top and bottom edges — the X.

```glsl
float beamField(vec2 p, float waist, float flare, float sigma, float freq) {
  // Axis position: pinches to `waist` at p.y == 0, opens as |p.y| grows.
  float axis = waist + flare * p.y * p.y;

  // Distance to the nearer of the two mirrored axes.
  float d = abs(abs(p.x) - axis);

  // Narrow ridge — the caustic itself. The cosine harmonic produces the
  // satellite bands; real caustics ring, they do not fall off cleanly.
  float core = exp(-(d * d) / (2.0 * sigma * sigma))
             * ((1.0 - uRing) + uRing * cos(d * freq));

  // Broad halo — the scattered light that carries to the frame edges.
  float halo = exp(-(d * d) / (2.0 * uHaloSigma * uHaloSigma));

  return core + uHalo * halo;
}
```

Two terms, and both are load-bearing.

The **cosine harmonic** is what makes the beams read as light through glass rather than as a blurred gradient. Without it they are a single soft smear.

The **halo** is what stops the corners going black. Fitted without it, the image resolves to two isolated crescents on a dead field; with it, light fills the frame the way the reference does. It is a small amplitude — around 0.05 — doing a large amount of work.

### `uRing` is capped on purpose

`uRing` is the harmonic's amplitude, and it is the one parameter where taste overrules the fit.

Left free, the fit pushes it up around 0.38, because a strong harmonic buys a slightly better numerical match. But past roughly **0.2** the satellite bands stop reading as part of the ridge and start reading as **separate waves overlapping it** — two wave systems interfering rather than one body of light. It is the difference between a caustic and a moiré.

**Default 0.14, and the fit is bounded to 0.22.** Below that the bands are present as texture and depth without ever separating into their own forms. If a future re-fit wants more, the answer is no: the cap is the design decision.

### 2.3 Shape

```glsl
float L = beamField(p - uOrigin, uWaist, uFlare, uSigma, uFreq);
L *= smoothstep(uVignetteOuter, uVignetteInner, dot(p, p));   // corner falloff
L  = pow(clamp(L, 0.0, 1.0), uGamma) * uGain;
```

High `uGamma` is what gives the reference its depth: the light stays very dim across a wide area and then rises quickly near the beam cores. Low gamma produces a flat, washed grey that reads as fog.

### 2.4 Quantize and dither

The step that matters:

```glsl
float n = noise(gl_FragCoord.xy);                              // [0, 1)
float q = floor(L * uLevels + 0.5 + (n - 0.5) * uGrain) / uLevels;
fragColor = vec4(vec3(q), 1.0);
```

- `uLevels` ≈ **8–14**. Fewer gives hard posterized bands with aggressive grain; more smooths toward an ordinary gradient and loses the character.
- `uGrain` = **1.0** is mathematically correct dither — noise spans exactly one quantization step. Above 1.0 is deliberate over-dithering, which reads as film. The reference appears over-dithered; expect to land around **1.4–2.0**.
- **Output is greyscale. Always.** `vec3(q)`. No hue ever enters the field — see [color.md](color.md) rule 2.

### 2.5 Noise source

Three options, all texture-free. The proof page switches between them so the choice can be made by eye:

| Mode | Character | Notes |
|------|-----------|-------|
| **`ign`** | **Locked default** | Interleaved gradient noise — a one-liner, no texture. Structured rather than random: it leaves a fine diagonal weave at low `uLevels`. |
| `blue` | Cleanest, most even | 64² tile generated once at init by filter-and-rank. Best dither quality, least character. |
| `white` | Most filmic, least even | Plain hash. Closest to the reference's organic grain; noisier in flat areas. |

**`ign` is the chosen one, and the choice is not the closest match to the reference.** White noise is nearer to the header's film grain. IGN's faint diagonal weave reads as *screened* rather than *photographed* — a halftone rather than film — and that is the deliberate preference: it makes the dither legible as a technique instead of as an accident of exposure.

Two practical notes. The weave is most visible at low `uLevels` and at DPR 1; at the capped 1.5 on a retina display it tightens into texture. And it costs nothing — no texture upload, no generation step — which matters for the Tier 3 hairline that appears on every screen.

```glsl
// Interleaved gradient noise — texture-free, near blue-noise quality.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
```

**Do not use an 8×8 Bayer matrix.** It leaves a visible crosshatch at these level counts, and the reference has no repeating pattern anywhere in it.

### 2.6 Two non-negotiable sampling rules

**Sample noise in screen space.** `gl_FragCoord.xy`, never UV. UV-space dither scales with the element, so grain swims during a resize and changes size between a card and a full-bleed header.

**Cap device pixel ratio at 1.5.** Grain is a physical texture — it must be the same size on every display. Uncapped DPR makes it half-size and invisible on a phone, and triples fill cost for no benefit.

```js
const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
```

---

## 3. Pointer response

Three coupled behaviours. All damped, never assigned directly.

**The waist follows the pointer.** `uOrigin` tracks a damped fraction (≈0.35) of pointer position, so the convergence point drifts toward where you are looking without chasing the cursor.

**Proximity opens the aperture.** Pointer near the waist tightens `uWaist` and lifts `uGain`; pointer far away lets both relax. The field pays attention to you.

**Velocity adds flare.** Fast movement briefly raises `uFlare` and `uGain`, then decays. Moving light smears — it is the behaviour people already expect from light, which is why it reads as physical rather than as an effect.

### 3.1 Damping is the entire feel

Never write `cur += (target - cur) * 0.1`. That is frame-rate dependent: it settles roughly twice as fast on a 120Hz display as on a 60Hz one, so the field feels like a different object on different hardware.

```js
// Frame-rate independent exponential smoothing.
const k = 1 - Math.exp(-dt / tau);
cur += (target - cur) * k;
```

`tau` is the time to close ~63% of the remaining gap. Different values per parameter give the field internal inertia — the parts do not all move together, which is what makes it feel like a material rather than a slider.

| Parameter | τ | Why |
|-----------|---|-----|
| Pointer origin | 0.18s | Responsive without being twitchy |
| Gain | 0.45s | Light takes a moment to build |
| Flare (velocity) | 0.25s | Smear settles quickly |
| **Waist / convergence** | **0.9s** | State changes should feel slow and consequential |

The 0.9s on convergence is deliberate. When two people match, the field should take a beat to close — a fast snap reads as a UI toggle, a slow close reads as something arriving.

---

## 4. Convergence carries state

The field's waist is driven by a single value in `0…1` meaning **how converged is this**. `0` is beams wide apart and dim; `1` is a single bright fused column.

```
uWaist = mix(uWaistOpen, uWaistClosed, convergence)
```

| Surface | Convergence source |
|---------|--------------------|
| Event header | fraction of joined participants currently `looking` |
| Looking list, empty | `0` — nobody here yet |
| Profile peek | `0.5`, static |
| Like sent | pulse to `0.7`, settle to `0.55` |
| **Match** | `0.95` — bright waist, the payoff |
| **Team formed** | `1.0`, held, plus the bloom — see §4.2 |
| **Day-of finder** | `1 − (distance / maxDistance)` |

### 4.2 Team formed — the bloom

Convergence reaching `1.0` is the only state in the product where the field does something beyond moving. It is staged in four movements, and the staging is the point — a single flash is loud, a sequence is majestic.

| | Movement | Duration | What happens |
|---|----------|----------|--------------|
| 1 | **Close** | ~0.6s | Convergence runs to 1.0, but `tau.waist` is scaled by **1.8** for the duration, so the beams merge slowly and inevitably rather than snapping |
| 2 | **Gather** | ~0.4s | `uBloom` goes **negative**: the field contracts and darkens. An intake of breath |
| 3 | **Release** | peak at ~0.66s | Attack 0.32s, decay 2.2s. Light floods out to the frame edges |
| 4 | **Hold** | indefinite | A slow breathe at ±6% over 9 seconds |

```
bloom(t) = (1 − e^(−t/0.32)) · e^(−t/2.20) / peak   +   gather(t)
gather(t) = −0.38 · e^(−(t+0.22)² / 2·0.16²)
```

Normalisation is derived from attack and decay rather than hardcoded, so the shape survives those being tuned.

| At peak the bloom | Why |
|-------------------|-----|
| Lowers `uGamma` by `0.26 × bloom` | Flattens the falloff so light *spreads* rather than just brightening |
| Lifts `uGain` by `1.15 × bloom` | The release |
| Adds `0.30 × bloom` as a wide gaussian at the waist | Fills the centre where the beams just met |
| Multiplies `uHalo` by up to **3.2×** | **Scale.** The light carries to the frame edges, so the field grows rather than the beams merely getting hotter |

**The gather is what makes it feel large.** Because `uBloom` is signed, the negative lobe runs every one of those terms backwards for free — the falloff steepens, gain drops, the core subtracts. No separate code path, and anticipation does more for perceived scale than amplitude does.

**Deliberately not a ripple ring.** An expanding circular wavefront was the obvious option and it is wrong here: it reads as a generic UI effect applied to the field, not as the field's own light doing something. Every movement above uses only levers the field already has.

Amplitude scales by `amount`, **default 0.95**. The peak genuinely blows out, and that is intended — it is held for a fraction of a second and then falls away over two seconds. Judge it running; a still always overstates it.

Both the bloom and the breathe are motion, so both stop under `prefers-reduced-motion` ([motion.md §6](motion.md#6-reduced-motion)) — the state still reads, because convergence `1.0` is a fused column whether or not it pulsed to get there.

### 4.1 The finder

[day-of.md](../day-of.md) locks "coarse pin + **warmer / colder**" and an AirTag-like personalised finder, because indoor GPS is not accurate enough to show a real position.

Convergence **is** warmer/colder. At 40m the beams sit wide apart and dim; at 3m they close into a single bright column. No distance readout, no progress bar.

This is not only a nicer visual — it is more honest about the data. A jittery indoor GPS fix rendered as a number jumps between "18m" and "31m" and looks broken. The same fix rendered through a 0.9s damped field becomes a gentle breathing motion, which accurately communicates *roughly this far, closing*. The imprecision of the sensor and the imprecision of the medium match.

Pair it with the one number that is trustworthy: a Martian Mono distance band (`~30m`, `~10m`, `close`), never a false-precision figure.

Two locked constraints the finder surface has to respect ([day-of.md](../day-of.md) D1–D2): the target must have opted into **want to be found**, and if you are on a team you see **teammates only**. The field says nothing about who is findable — it only renders distance to the one target you already chose.

---

## 5. Three tiers

Without tiers the field becomes visual noise on every surface. Each tier has a job and a cost.

### Tier 1 — Field (live)
Full-bleed WebGL2 canvas, pointer-reactive, damped.

- **Maximum one per route.** Not one per section — one per route.
- `IntersectionObserver` stops the rAF loop when scrolled offscreen; `visibilitychange` stops it on tab blur.
- Where: event header, join screen, the Auth0 moment, match, day-of finder.

### Tier 2 — Panel (still)
The same shader rendered **once** at mount, or a pre-baked WebP. No animation loop at all.

- Where: card backgrounds, empty states, sheet headers.
- State changes cross-fade between two baked frames rather than animating the shader live.

### Tier 3 — Edge
A 1px dithered hairline — the same threshold applied to a linear luminance ramp, as a `border-image` or a tiny tiling SVG.

- Replaces flat `rgba(255,255,255,.08)` dividers and card borders.
- Where: every divider and every card edge in the product.
- Costs essentially nothing and puts the dither language on screens that have no field at all. This is what makes the system feel continuous rather than "the header has a gradient."

---

## 6. Responsive and touch

There is no pointer on a phone, and most candidates arrive on one.

- **Autonomous drift** — a low-amplitude sine on `uOrigin`, period ≈30s, amplitude ≈0.04. Barely perceptible; enough that the field is alive.
- **Scroll coupling** — scroll position offsets `uOrigin.y` slightly. Free interaction, no extra input.
- **Touch** — tap or drag moves the waist, same damping as pointer.
- **Portrait `uFlare`** — roughly half the landscape value. At tall aspect ratios a landscape flare pushes the lobes entirely off-screen and the frame reads as an empty grey smear.

---

## 7. Legibility

The field is a background. It has to lose to text, every time.

**Luminance under body text must never exceed 0.35.** Two ways to guarantee it:

- **Scrim** — the shader multiplies a soft elliptical darkening under the text's bounding box. Preferred, because it moves with the layout.
- **Placement** — type sits only in the field's dark quadrants.

The reference does the second, and it is worth noticing *where* it puts the wordmark: at the waist, which is the **darkest** part of the composition, not the brightest. The light frames the word rather than sitting behind it. Follow this.

---

## 8. Fallbacks

The page must be good with no WebGL and no JavaScript.

| Condition | Behaviour |
|-----------|-----------|
| No WebGL2 | Pre-baked WebP at Tier 2 quality |
| `prefers-reduced-motion: reduce` | Field renders one frame at its current convergence and freezes. State changes cross-fade the frame over 200ms. Temporal shimmer off. |
| `Save-Data` header | Baked WebP, no canvas |
| No JS at all | CSS `radial-gradient` plus a tiled SVG `feTurbulence` grain |

A frozen field still looks like the reference — the reference is a still image. Reduced motion costs this design almost nothing, which is a good sign.

---

## 9. Performance budget

- 60fps on a mid-range phone with the field full-bleed.
- rAF stops entirely when offscreen or on a blurred tab. A field nobody is looking at costs zero.
- DPR capped at 1.5 (§2.6) — this is a fill-rate bound shader, and capping DPR is the single biggest win.
- Temporal shimmer (per-frame noise offset on a golden-ratio sequence) is **optional** and off by default. It is a real cost for a subtle gain, and it is motion, so it is off under reduced motion regardless.
- One shared WebGL context if more than one Tier 1 field ever coexists. Per §5 it should not.

---

## 10. Parameters

| Uniform | Reference value | Range | Meaning |
|---------|-----------------|-------|---------|
| `uWaist` | **0.548** | 0.05 – 1.4 | Beam separation at centre — **the convergence parameter** |
| `uFlare` | **0.460** | −3 – 3 | How fast beams open away from centre |
| `uSigma` | **0.142** | 0.02 – 0.6 | Gaussian width of the ridge |
| `uFreq` | **14.26** | 0 – 40 | Satellite band frequency |
| `uGain` | **0.426** | 0.05 – 3.0 | Overall brightness |
| `uGamma` | **0.626** | 0.3 – 6.0 | Falloff shaping |
| `uHalo` | **0.053** | 0 – 1 | Broad halo amplitude |
| `uHaloSigma` | **0.740** | 0.1 – 2.5 | Broad halo width |
| `uRing` | **0.14** | 0 – 0.22 | Harmonic amplitude — capped, see §2.2 |
| `uBloom` | driven | 0 – 1 | Team-formed envelope, see §4.2 |
| `uVignetteInner` | **0.0** | 0 – 4 | Corner falloff, inner edge |
| `uVignetteOuter` | **4.0** | 0 – 4 | Corner falloff, outer edge |
| `uLevels` | **10** | 3 – 32 | Quantization steps |
| `uGrain` | **1.70** | 0 – 3.0 | Dither amplitude (1.0 = mathematically correct) |
| noise mode | **ign** | white / ign / blue | See §2.5 |
| `uOrigin` | driven | −1 – 1 | Damped pointer offset |

Team-formed response (§4.2):

| Constant | Value |
|----------|-------|
| `amount` | 0.95 |
| `delay` | 0.60s |
| `gather` | 0.38 |
| `attack` | 0.32s |
| `decay` | 2.20s |
| `slowdown` | 1.8× on `tau.waist` |
| `haloLift` | 2.2 |
| breathe | ±6% over 9s |

All of these live in [`src/lib/field/renderer.js`](../../src/lib/field/renderer.js) as `FIELD_DEFAULTS`, `TAU`, `BLOOM` and `BREATHE`. That file is the source of truth; this table documents it.

### How these were derived

The light-field values come from [proof/field.html](proof/field.html)'s auto-fit: coordinate descent from 90 random starts, scored against a downsampled `Converge Header_v0.1.png`.

Two things about that objective are worth knowing before re-running it.

**Dither is off during scoring.** The fit targets the smooth light field, compared against a reference downsampled enough that its grain averages out. `uLevels`, `uGrain` and the noise mode are *not* fitted — they are judgement calls, made by eye against the overlay. A number cannot tell you how filmic you want it.

**`uRing` is bounded by taste, not by the data.** See §2.2 — the fit wants more harmonic than looks right.

**The objective weights structure, not just level.** Mean absolute error alone converges on a flat grey wash that matches the reference's average brightness and has no beams in it at all. Adding a gradient-difference term at 3× weight is what makes local contrast count, and it is the difference between "fog" and "light".

### Known divergence

The fit is close but not exact. Put the overlay in difference mode and a faint X remains at the centre: the reference has slightly more light where its beams cross than parabolic axes with a fixed `uWaist` can produce, because the reference's beams appear to genuinely cross rather than approach and retreat.

Closing that would mean a different axis formulation. It is a deliberate open question, not an oversight — the current model is close enough that the difference is only visible in difference mode, and it keeps `uWaist` as a single clean convergence parameter, which §4 depends on. Trading that away for a marginally better still image would cost the state mapping that makes the field mean something.

---

## 11. The two files

The field lives in two files, and the split matters.

| File | What it is |
|------|-----------|
| **[`src/lib/field/renderer.js`](../../src/lib/field/renderer.js)** | **The field.** Framework-free ES module, no dependencies, no build step. Shaders, locked constants, damping, the bloom envelope, blue-noise generation, and `createField(canvas, opts)`. It lives in the app because the app is what ships it. |
| [`proof/field.html`](proof/field.html) | The tuning harness. Panel, sliders, presets, overlay, auto-fit. Throwaway — it exists to make decisions, not to ship. |

**The renderer is the deliverable.** The harness imports the same file the app does, so what you tune in the panel is what runs in production — there is no second implementation to drift.

```js
import { createField } from "@/lib/field/renderer.js"

const field = createField(canvas, { convergence: 0.35, ambient: true })
if (!field) showBakedStill()                  // no WebGL2 — see §8

field.setScrollConvergence(0.6)               // scroll-driven, never blooms
field.setConvergence(1.0, { bloom: true })    // team formed, with the response
field.destroy()                               // on unmount
```

`createField` returns `null` rather than throwing when WebGL2 is missing, so the fallback is a branch the caller must handle. It respects `prefers-reduced-motion` on its own, and with `observe: true` (the default) it stops its own rAF loop offscreen and on tab blur.

**`ambient: true`** makes the breathe available at any convergence rather than only in the held team-formed state — what a hero needs to stay alive without pretending a team just formed.

**Flare scales with aspect.** The locked parameters were fitted on a 2.33 letterbox. Because coordinates normalise by height, a squarer viewport has less horizontal room and the lobes end up filling the frame instead of sweeping out of it. `aspectFlare()` corrects for that and is exactly 1.0 at the reference aspect, so the fitted look is unchanged where it was fitted.

### Running the harness

```bash
npx serve        # from the repo root — the harness imports from src/
```

Then open `/docs/design/proof/field.html`.

A server is required now that the harness is an ES module — `file://` blocks module imports. It was already required for **auto-fit**, which reads the reference image back off a canvas and is blocked by canvas tainting on `file://`; the button reports *blocked* if you try.

### Reading the overlay

**Difference mode is off by default** — the plain overlay is the better way to look at the thing, and difference is the diagnostic you reach for, not the resting state. *Match the reference* respects whichever mode you are in: 50% opacity when plain, 100% when difference, because a plain overlay at full opacity would just hide the field.

Turn **difference** on and push the overlay to 1.00 when you want the diagnostic: the closer the match, the blacker the screen, and whatever is left is exactly what the model gets wrong.

**Lock aspect** constrains the canvas to the reference's 2.3337 ratio. Comparison is meaningless without it.

### URL parameters

Every uniform can be set in the query string, which makes the page scriptable for screenshots and batch comparison:

```
?bare=1&ref=1&influence=0&waist=0.548&gain=0.426&grain=0
?fit=1&starts=90                    # run the fit, publish result in document.title
?convergence=1&bloomhold=1          # pin the bloom at peak to inspect it as a still
```

`bare=1` hides all controls. `influence=0` disables pointer response, which you want for any still comparison. `freeze=1` emulates `prefers-reduced-motion`. `bloomhold` pins the team-formed envelope at a fixed phase.

### What to judge, in order

1. **Structure** — beam curvature, waist, how far light carries. Auto-fit gets you here.
2. **Tone** — `gain` and `gamma`, by eye against the overlay.
3. **Grain** — `levels`, `grain` and the noise mode. Never fitted, always judged. Check it at several window sizes; it must not change size.
4. **Ring** — push `ring` to 0.4 and back to 0.14 to see the failure it prevents: the satellite bands detaching into their own wave system over the ridge.
5. **Damping** — click the state presets and watch the *transitions*. This is the part no still image can tell you about, and it is the part that decides whether the field feels like a material or a slider.
6. **The bloom** — hit *team formed*, then *replay* to see it again without changing state. Judge it in motion: the peak is held for a fraction of a second, so a frozen frame always looks stronger than the thing does. `?bloomhold=-0.38` pins the gather and `?bloomhold=1` pins the peak if you want to inspect either as a still.

---

## 12. Open for implementation

Carried forward rather than settled here:

- **The beams approach but do not cross** (§10). A faint X remains in difference mode.
- **Tier 2 and Tier 3 have no code yet.** `createField` is Tier 1 only. The still-panel bake and the dithered hairline still need building, and the hairline is the piece that puts the dither language on screens with no field.
- **Baked fallbacks do not exist.** §8 specifies them; nothing generates them. A script that renders the shader headlessly to WebP at a few convergence values would cover it.
- **Scrim under text** (§7) is specified as the preferred approach but not implemented — currently legibility depends on placement alone.
