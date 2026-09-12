"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useField, useFieldClaim } from "@/components/field/FieldProvider";
import { damp } from "@/lib/field/renderer.js";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Avatar } from "./Avatar";

type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  /** Position on the venue plan, 0–100 × 0–62. */
  x: number;
  y: number;
  /** day-of.md D2 — the finder only targets people who opted in. */
  findable: boolean;
};

// Nicknames are generated (Grok, auth.md 2.6), which is why they read like
// this rather than like real names.
const PEOPLE: Person[] = [
  { id: "ripple", name: "Ripple", initials: "R", role: "Backend", x: 74, y: 20, findable: true },
  { id: "quartz", name: "Quartz", initials: "Q", role: "Design", x: 26, y: 40, findable: true },
  { id: "ember", name: "Ember", initials: "E", role: "ML", x: 60, y: 47, findable: false },
  { id: "lumen", name: "Lumen", initials: "L", role: "Frontend", x: 18, y: 16, findable: true },
  { id: "onyx", name: "Onyx", initials: "O", role: "Hardware", x: 86, y: 44, findable: true },
];

const YOU = { x: 48, y: 33 };

/** Coarse bands, never a false-precision figure — day-of.md §3.3. */
function band(metres: number) {
  if (metres <= 2) return { label: "close", warmth: 4 };
  if (metres <= 9) return { label: `~ ${Math.round(metres)} m`, warmth: 3 };
  if (metres <= 22) return { label: `~ ${Math.round(metres / 2) * 2} m`, warmth: 2 };
  return { label: `~ ${Math.round(metres / 5) * 5} m`, warmth: 1 };
}

const distanceTo = (p: Person) => Math.hypot(p.x - YOU.x, p.y - YOU.y) * 0.85;
const bearingTo = (p: Person) => (Math.atan2(p.x - YOU.x, YOU.y - p.y) * 180) / Math.PI;

export function FindSection() {
  const reduced = useReducedMotion();
  const { measure } = useField();

  const [selected, setSelected] = useState<Person | null>(null);
  const [blocked, setBlocked] = useState<Person | null>(null);
  const [metres, setMetres] = useState(0);
  const [heading, setHeading] = useState(0);
  const [arrived, setArrived] = useState(false);

  // Convergence is literally 1 − distance/max — field.md §4.1. The field is
  // not illustrating the finder; it is the finder.
  const proximity = useRef(0);
  const claim = useFieldClaim({
    from: 0.12,
    to: 0.4,
    gain: 0.5,
    resolve: (p) => (selected ? 0.15 + proximity.current * 0.8 : 0.12 + p * 0.28),
  });

  const startWalk = useCallback((person: Person) => {
    if (!person.findable) {
      setBlocked(person);
      return;
    }
    setBlocked(null);
    setArrived(false);
    setSelected(person);
    setMetres(distanceTo(person));
    setHeading(bearingTo(person));
    proximity.current = 0;
  }, []);

  const reset = useCallback(() => {
    setSelected(null);
    setArrived(false);
    proximity.current = 0;
    measure();
  }, [measure]);

  // The walk. Motion that answers an action is welcome — you asked to find
  // someone, so the interface shows you closing on them.
  useEffect(() => {
    if (!selected) return;
    const total = distanceTo(selected);
    const trueBearing = bearingTo(selected);

    if (reduced) {
      setMetres(0);
      setHeading(trueBearing);
      proximity.current = 1;
      setArrived(true);
      measure();
      return;
    }

    let raf = 0;
    let last = performance.now();
    const startedAt = last;
    let current = total;
    let currentHeading = trueBearing;
    let done = false;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - startedAt) / 1000;

      // Walk in, then hold. Damped so it decelerates into arrival rather
      // than hitting zero at speed.
      const target = elapsed > 0.4 ? 0 : total;
      current = damp(current, target, 2.1, dt);

      // GPS wanders. An indoor fix that sat perfectly still would be a lie.
      const wobble = Math.sin(elapsed * 1.7) * 6 * Math.min(1, current / total);
      currentHeading = damp(currentHeading, trueBearing + wobble, 0.35, dt);

      setMetres(current);
      setHeading(currentHeading);
      proximity.current = 1 - current / total;
      measure();

      // Arrival brightens the waist through `proximity`. It does not bloom —
      // that is team formed, and blowing the page out would cost the copy
      // sitting beside this panel.
      if (!done && current <= 1.4) {
        done = true;
        setArrived(true);
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selected, reduced, measure]);

  const b = band(metres);

  return (
    <section id="find" ref={claim} className="relative flex min-h-dvh items-center px-5 py-28">
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-14 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
        <div className="text-scrim">
          <h2 className="display-m text-ink">Walk toward each other.</h2>
          <p className="body-l text-ink-2 mt-5 max-w-[34ch]">
            Indoors we tell you warmer or colder, instead of pretending to know exactly where you
            are.
          </p>

          <dl className="mt-10 max-w-[34ch]">
            {[
              [
                "The organizer turns the map on",
                "Off until they enable it, off again when the event ends.",
              ],
              ["You Join before you share location", "No profile, no pin."],
              ["They turn on want to be found", "Try Ember — she hasn't."],
              ["On a team, you see teammates only", "Your team's pins stay inside your team."],
            ].map(([term, detail]) => (
              <div key={term} className="border-line-quiet border-t py-3 last:border-b">
                <dt className="body-s text-ink-2">{term}</dt>
                <dd className="body-s text-ink-3">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          {/* The panel holds one height for both states, so switching into
              the finder does not make the layout jump. */}
          <div className="border-line bg-void/55 relative min-h-[560px] overflow-hidden rounded-[24px] border backdrop-blur-xl">
            <VenueMap
              people={PEOPLE}
              selected={selected}
              blocked={blocked}
              onPick={startWalk}
              dimmed={!!selected}
            />
            {selected ? (
              <Finder
                person={selected}
                metres={metres}
                heading={heading}
                band={b}
                arrived={arrived}
                onBack={reset}
              />
            ) : null}
          </div>

          <p aria-live="polite" className="sr-only">
            {selected
              ? arrived
                ? `You have reached ${selected.name}.`
                : `${b.label} from ${selected.name}.`
              : blocked
                ? `${blocked.name} has not turned on want to be found.`
                : "Pick someone on the venue map to walk toward them."}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the map */

function VenueMap({
  people,
  selected,
  blocked,
  onPick,
  dimmed,
}: {
  people: Person[];
  selected: Person | null;
  blocked: Person | null;
  onPick: (p: Person) => void;
  dimmed: boolean;
}) {
  return (
    <div
      className="relative transition-opacity duration-[480ms] ease-[cubic-bezier(.16,1,.3,1)]"
      style={{ opacity: dimmed ? 0.18 : 1 }}
    >
      <div className="border-line-quiet flex items-baseline justify-between border-b px-5 py-4">
        <span className="heading-s text-ink">Ground floor</span>
        <span className="code text-ink-3">{people.length} looking</span>
      </div>

      <div className="relative">
        {/* Schematic, not cartography. The data is a coarse pin, so the map
            is drawn as zones rather than as a street map that would imply a
            precision the sensor does not have. */}
        <svg viewBox="0 0 100 62" className="block w-full" aria-hidden="true">
          <title>Venue plan</title>
          {[
            { x: 6, y: 6, w: 40, h: 24, label: "Main hall" },
            { x: 50, y: 6, w: 44, h: 24, label: "Workshop" },
            { x: 6, y: 34, w: 26, h: 22, label: "Café" },
            { x: 36, y: 34, w: 58, h: 22, label: "Mezzanine" },
          ].map((z) => (
            <g key={z.label}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="2"
                fill="rgba(255,255,255,.018)"
                stroke="rgba(255,255,255,.07)"
                strokeWidth="0.25"
              />
              <text
                x={z.x + 2.5}
                y={z.y + 5}
                fill="rgba(255,255,255,.22)"
                style={{ font: "2.6px var(--font-sans)" }}
              >
                {z.label}
              </text>
            </g>
          ))}
        </svg>

        {/* People sit above the SVG so they can be real buttons. */}
        <div className="absolute inset-0">
          {people.map((p, i) => {
            const isBlocked = blocked?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p)}
                aria-label={`Find ${p.name}, ${p.role}${p.findable ? "" : " — not findable"}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2"
                style={{ left: `${p.x}%`, top: `${(p.y / 62) * 100}%` }}
              >
                <span
                  data-keep-motion
                  className={`block h-2.5 w-2.5 rounded-full transition-[transform,background-color] duration-[200ms] group-hover:scale-150 ${
                    isBlocked ? "bg-ink-4" : "bg-ink"
                  } ${p.findable ? "animate-[pulse-point_3.4s_ease-in-out_infinite]" : ""}`}
                  style={{ animationDelay: `${i * 480}ms` }}
                />
                <span className="label text-ink-2 pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.name}
                </span>
              </button>
            );
          })}

          {/* You. A ring rather than a dot, because it is a coarse fix. */}
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${YOU.x}%`, top: `${(YOU.y / 62) * 100}%` }}
          >
            <span className="border-ink/70 block h-4 w-4 rounded-full border" />
          </span>
        </div>
      </div>

      <div className="border-line-quiet flex items-center justify-between border-t px-5 py-3">
        <span className="body-s text-ink-3">
          {blocked
            ? `${blocked.name} hasn't turned on want to be found.`
            : "Pick someone to walk toward them."}
        </span>
        {selected ? null : <span className="body-s text-ink-4">Live</span>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- the finder */

function Finder({
  person,
  metres,
  heading,
  band: b,
  arrived,
  onBack,
}: {
  person: Person;
  metres: number;
  heading: number;
  band: { label: string; warmth: number };
  arrived: boolean;
  onBack: () => void;
}) {
  const R = 86;
  const C = 2 * Math.PI * R;
  const total = distanceTo(person);
  const closed = Math.min(1, Math.max(0, 1 - metres / total));

  return (
    <div
      data-keep-motion
      className="bg-void/92 absolute inset-0 flex animate-[match-in_320ms_cubic-bezier(.16,1,.3,1)_both] flex-col items-center justify-center gap-6 px-6 py-8"
    >
      <div className="relative grid place-items-center">
        <svg width="196" height="196" viewBox="-106 -106 212 212" aria-hidden="true">
          <title>Direction and distance</title>
          <circle r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
          <circle
            r={R}
            fill="none"
            stroke="rgba(255,255,255,.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - closed)}
            transform="rotate(-90)"
            style={{ transition: "stroke-dashoffset 120ms linear" }}
          />
          {arrived ? (
            <circle r="30" fill="rgba(255,255,255,.92)" />
          ) : (
            <g
              style={{
                transform: `rotate(${heading}deg)`,
                transition: "transform 90ms linear",
              }}
            >
              <path
                d="M0 -54 L30 30 L0 12 L-30 30 Z"
                fill="rgba(255,255,255,.92)"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="text-center">
        {/* A magnitude, not a string to transcribe — so no code tracking. */}
        <p className="code-l text-ink text-[clamp(24px,5vw,34px)] tracking-normal tabular-nums">
          {arrived ? "You're here" : b.label}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="body-s text-ink-3">warmer</span>
          <span className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-[320ms] ${
                  n <= b.warmth ? "bg-ink" : "bg-ink-4"
                }`}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="border-line bg-surface/70 flex items-center gap-3 rounded-[16px] border px-4 py-3 backdrop-blur-xl">
        <Avatar initials={person.initials} seed={person.name.length} size={36} />
        <div className="text-left">
          <p className="heading-s text-ink leading-tight">{person.name}</p>
          <p className="body-s text-ink-3">{person.role} · want to be found</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="label text-ink-2 hover:text-ink border-line hover:border-line-loud rounded-[10px] border px-4 py-2 transition-colors duration-[120ms]"
      >
        {arrived ? "Find someone else" : "Back to map"}
      </button>
    </div>
  );
}
