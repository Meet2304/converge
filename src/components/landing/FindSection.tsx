"use client"

import { useFieldClaim } from "@/components/field/FieldProvider"
import { useSectionProgress } from "@/lib/use-section-progress"

/**
 * Coarse bands, never a false-precision figure.
 *
 * Indoor GPS cannot place a person to the metre, so the interface does not
 * claim it can — day-of.md §3.3. The imprecision of the sensor and the
 * imprecision of the readout match.
 */
const BANDS = [
  { label: "~ 40 m", warmth: 1 },
  { label: "~ 20 m", warmth: 2 },
  { label: "~ 8 m", warmth: 3 },
  { label: "close", warmth: 4 },
] as const

const GATES = [
  "The organizer turns the map on",
  "You Join before you share location",
  "They turn on want to be found",
  "On a team, you see your teammates only",
]

export function FindSection() {
  // Convergence is literally 1 − distance/max here — field.md §4.1. The field
  // is not illustrating the finder; it is the finder.
  const ref = useFieldClaim({ from: 0.1, to: 0.95 })
  const progress = useSectionProgress(ref)

  const band = BANDS[Math.min(BANDS.length - 1, Math.floor(progress * BANDS.length))]
  const arrived = band.warmth === 4

  return (
    <section
      id="find"
      ref={ref}
      className="relative flex min-h-[140vh] flex-col items-center justify-center gap-12 px-5 py-32"
    >
      <div className="flex w-full max-w-[880px] flex-col items-center gap-12 md:flex-row md:items-center md:justify-between">
        {/* The finder, as it actually looks. */}
        <div
          className="border-line bg-surface/70 w-full max-w-[300px] rounded-[16px] border p-6 backdrop-blur-xl"
          aria-hidden="true"
        >
          <div className="flex h-10 items-center justify-center">
            {arrived ? (
              <span className="label text-ink-2">arrived</span>
            ) : (
              <span
                className="text-ink text-[22px] leading-none transition-transform duration-[320ms] ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ transform: `rotate(${(1 - progress) * -26}deg)` }}
              >
                ↑
              </span>
            )}
          </div>

          <p className="code-l text-ink mt-2 text-center tabular-nums">
            {band.label}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="body-s text-ink-3">warmer</span>
            <span className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-[320ms] ${
                    n <= band.warmth ? "bg-ink" : "bg-ink-4"
                  }`}
                />
              ))}
            </span>
          </div>

          <p className="body-s text-ink-2 border-line-quiet mt-5 border-t pt-4 text-center">
            Your teammate · want to be found
          </p>
        </div>

        <div className="measure">
          <h2 className="display-m text-ink">Walk toward each other.</h2>
          <p className="body-l text-ink-2 mt-5">
            Indoors we tell you warmer or colder, instead of pretending to know
            exactly where you are.
          </p>

          {/* Show the gate, and what unlocks it, in that order. */}
          <ul className="mt-8 space-y-0">
            {GATES.map((gate) => (
              <li
                key={gate}
                className="body-s text-ink-3 border-line-quiet border-t py-3 last:border-b"
              >
                {gate}
              </li>
            ))}
          </ul>

          {/* The animation is decorative; the content is not. */}
          <p className="sr-only">
            As you get closer the finder moves through coarse distance bands —
            about 40 metres, about 20 metres, about 8 metres, then close —
            rather than showing an exact position it cannot measure.
          </p>
        </div>
      </div>
    </section>
  )
}
