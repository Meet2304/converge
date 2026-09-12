/**
 * The generic Converge avatar. The anonymised state is a deliberate state
 * with its own look — a dithered disc — not a blurred or broken version of
 * the identified one. Identified adds initials over the same disc, so the
 * two read as one person in two access tiers rather than as two people.
 */
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='48' height='48' filter='url(%23n)'/></svg>\")";

export function Avatar({
  initials,
  seed = 0,
  size = 40,
}: {
  /** Shown only when the viewer is allowed to see identity. */
  initials?: string;
  seed?: number;
  size?: number;
}) {
  // Each person gets their own light angle so a list is not a row of clones.
  const angle = (seed * 47) % 360;
  return (
    <span
      aria-hidden="true"
      className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at ${30 + (seed % 3) * 15}% 28%, #4a4a4a, #141414 62%, #050505)`,
      }}
    >
      <span
        className="absolute inset-0 mix-blend-soft-light"
        style={{ backgroundImage: NOISE, transform: `rotate(${angle}deg) scale(1.4)` }}
      />
      {initials ? (
        <span
          className="text-ink relative font-[family-name:var(--font-display)] font-normal"
          style={{ fontSize: Math.max(16, size * 0.38) }}
        >
          {initials}
        </span>
      ) : null}
    </span>
  );
}
