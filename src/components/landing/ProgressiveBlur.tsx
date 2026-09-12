/**
 * Progressive blur band.
 *
 * A single backdrop-filter with a gradient mask leaves a visible hard edge.
 * True progressive blur needs stacked layers with the blur radius doubling
 * each time, each masked to a shorter window than the last, so the effect
 * accumulates toward the edge.
 *
 * It earns its place functionally: it is what keeps the nav legible over a
 * moving field, and it softens where a bright beam meets the viewport edge.
 * Stacked backdrop-filter is GPU-expensive, so the two heaviest layers are
 * dropped below the md breakpoint.
 */
export function ProgressiveBlur({
  side,
  height = 140,
}: {
  side: "top" | "bottom"
  height?: number
}) {
  const layers = [0.5, 1, 2, 4, 8]
  const to = side === "top" ? "to bottom" : "to top"

  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className={`pointer-events-none fixed inset-x-0 z-30 ${
        side === "top" ? "top-0" : "bottom-0"
      }`}
    >
      {layers.map((blur, i) => {
        // Heavier blur is masked to a shorter window, so it only reaches the
        // outermost sliver; the lightest layer covers the whole band.
        const stop = 100 - i * 20
        return (
          <div
            key={blur}
            className={`absolute inset-0 ${i >= 3 ? "hidden md:block" : ""}`}
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: `linear-gradient(${to}, black 0%, black ${stop * 0.45}%, transparent ${stop}%)`,
              WebkitMaskImage: `linear-gradient(${to}, black 0%, black ${stop * 0.45}%, transparent ${stop}%)`,
            }}
          />
        )
      })}
    </div>
  )
}
