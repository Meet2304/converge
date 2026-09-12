"use client";

import { useEffect, useRef, useState } from "react";
import { useField, useFieldClaim } from "@/components/field/FieldProvider";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Avatar } from "./Avatar";

type Candidate = {
  id: string;
  name: string;
  initials: string;
  role: string;
  skills: string[];
  experience: "First hackathon" | "A few" | "Experienced";
  wants: string;
  /** Mutual likes are the only thing that produces a match — 5.6. */
  likesYou: boolean;
  joined: string;
};

const CANDIDATES: Candidate[] = [
  {
    id: "quartz",
    name: "Quartz",
    initials: "Q",
    role: "Design",
    skills: ["Figma", "Motion", "Research"],
    experience: "A few",
    wants: "wants 3–4",
    likesYou: true,
    joined: "2m ago",
  },
  {
    id: "ripple",
    name: "Ripple",
    initials: "R",
    role: "Backend",
    skills: ["Go", "Postgres"],
    experience: "Experienced",
    wants: "wants 4",
    likesYou: false,
    joined: "11m ago",
  },
  {
    id: "lumen",
    name: "Lumen",
    initials: "L",
    role: "Frontend",
    skills: ["React", "WebGL", "Type"],
    experience: "First hackathon",
    wants: "wants 2–3",
    likesYou: false,
    joined: "24m ago",
  },
];

const ARRIVAL: Candidate = {
  id: "onyx",
  name: "Onyx",
  initials: "O",
  role: "Hardware",
  skills: ["ESP32", "CAD"],
  experience: "A few",
  wants: "wants 3",
  likesYou: false,
  joined: "just now",
};

export function LookingSection() {
  const reduced = useReducedMotion();
  const { measure } = useField();

  const [looking, setLooking] = useState(true);
  const [list, setList] = useState(CANDIDATES);
  const [liked, setLiked] = useState<string[]>([]);
  const [match, setMatch] = useState<Candidate | null>(null);
  const arrivedOnce = useRef(false);

  const sectionRef = useFieldClaim({
    from: 0.4,
    to: 0.62,
    gain: 0.42,
    ox: -0.18,
    // A match brightens the waist; it does not bloom. The bloom is reserved
    // for team formed — motion.md §5. Spending it here would also blow out
    // the copy sitting beside the panel.
    resolve: () => (match ? 0.86 : null),
  });

  // One arrival, once, when the section is actually on screen. A list that
  // grew forever would be noise; a single new joiner shows it is live and
  // that the locked sort is most-recent-first.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || arrivedOnce.current) return;
        arrivedOnce.current = true;
        timer = setTimeout(() => setList((l) => [ARRIVAL, ...l]), 2400);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [reduced, sectionRef]);

  function like(person: Candidate) {
    if (liked.includes(person.id)) return;
    setLiked((l) => [...l, person.id]);
    if (person.likesYou) {
      setTimeout(
        () => {
          setMatch(person);
          measure();
        },
        reduced ? 0 : 520,
      );
    }
  }

  return (
    <section
      id="before"
      ref={sectionRef}
      className="relative flex min-h-dvh items-center px-5 py-28"
    >
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
        {/* The panel leads on desktop — the product is the argument. */}
        <div className="order-2 lg:order-1">
          <div className="border-line bg-void/55 relative overflow-hidden rounded-[24px] border backdrop-blur-xl">
            <div className="border-line-quiet flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="heading-s text-ink">Looking</p>
                <p className="body-s text-ink-3">Newest first. No scores, no ranking.</p>
              </div>
              <LookingToggle on={looking} onChange={setLooking} />
            </div>

            <ul className="divide-line-quiet divide-y">
              {list.map((c, i) => (
                <li
                  key={c.id}
                  data-keep-motion
                  className={
                    c.id === ARRIVAL.id
                      ? "animate-[arrive_560ms_cubic-bezier(.16,1,.3,1)_both]"
                      : undefined
                  }
                >
                  <CandidateRow
                    person={c}
                    seed={i}
                    liked={liked.includes(c.id)}
                    onLike={() => like(c)}
                  />
                </li>
              ))}
            </ul>

            {match ? <MatchOverlay person={match} onDismiss={() => setMatch(null)} /> : null}
          </div>

          <p aria-live="polite" className="sr-only">
            {match
              ? `It's a match with ${match.name}.`
              : liked.length
                ? `You liked ${liked.length} ${liked.length === 1 ? "person" : "people"}.`
                : ""}
          </p>
        </div>

        <div className="text-scrim order-1 lg:order-2">
          <h2 className="display-m text-ink">Before the doors open.</h2>
          <p className="body-l text-ink-2 mt-5 max-w-[34ch]">
            Like the people you&rsquo;d want to build with. When it&rsquo;s mutual, it&rsquo;s a
            match — then talk, and make it a team.
          </p>
          <p className="body-s text-ink-3 mt-6 max-w-[32ch]">
            Try liking Quartz. She already liked you.
          </p>
        </div>
      </div>
    </section>
  );
}

function LookingToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="border-line hover:border-line-loud flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 transition-colors duration-[120ms]"
    >
      <span
        className={`relative block h-5 w-9 rounded-full transition-colors duration-[200ms] ${
          on ? "bg-ink" : "bg-ink-4"
        }`}
      >
        <span
          className={`bg-void absolute top-1 block h-3 w-3 rounded-full transition-[left] duration-[200ms] ease-[cubic-bezier(.16,1,.3,1)] ${
            on ? "left-5" : "left-1"
          }`}
        />
      </span>
      <span className="label text-ink-2">{on ? "You're looking" : "Not looking"}</span>
    </button>
  );
}

function CandidateRow({
  person,
  seed,
  liked,
  onLike,
}: {
  person: Candidate;
  seed: number;
  liked: boolean;
  onLike: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Avatar initials={person.initials} seed={seed + 2} size={40} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="heading-s text-ink truncate leading-tight">{person.name}</p>
          <span className="body-s text-ink-3 shrink-0">{person.joined}</span>
        </div>
        <p className="body-s text-ink-3 mt-0.5">
          {person.role} · {person.experience} · {person.wants}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {person.skills.map((s) => (
            <span
              key={s}
              className="body-s text-ink-2 border-line-quiet rounded-[6px] border px-2 py-0.5"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        aria-label={liked ? `Liked ${person.name}` : `Like ${person.name}`}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-[200ms] ease-[cubic-bezier(.16,1,.3,1)] active:scale-90 ${
          liked ? "border-ink bg-ink" : "border-line hover:border-line-loud"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <title>Like</title>
          <path
            d="M12 20.5 3.8 12.3a5 5 0 1 1 7.1-7.1l1.1 1.1 1.1-1.1a5 5 0 1 1 7.1 7.1Z"
            fill={liked ? "#000" : "none"}
            stroke={liked ? "#000" : "rgba(255,255,255,.7)"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function MatchOverlay({ person, onDismiss }: { person: Candidate; onDismiss: () => void }) {
  return (
    <div
      data-keep-motion
      className="bg-void/80 absolute inset-0 z-10 grid animate-[match-in_520ms_cubic-bezier(.16,1,.3,1)_both] place-items-center px-6 backdrop-blur-md"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span
            data-keep-motion
            className="animate-[converge-left_560ms_cubic-bezier(.16,1,.3,1)_both]"
          >
            <Avatar initials="Y" seed={1} size={52} />
          </span>
          <span
            data-keep-motion
            className="animate-[converge-right_560ms_cubic-bezier(.16,1,.3,1)_both]"
          >
            <Avatar initials={person.initials} seed={person.name.length} size={52} />
          </span>
        </div>
        <p className="display-m text-ink mt-6">It&rsquo;s a match</p>
        <p className="body text-ink-2 mt-2">You and {person.name} liked each other.</p>

        <div className="mt-7 flex flex-col items-center gap-3">
          {/* Chat needs Auth0 — auth.md §3.3. The button says the real gate. */}
          <button
            type="button"
            className="bg-ink text-void h-11 rounded-[10px] px-5 font-[family-name:var(--font-display)] text-[16px] font-semibold"
          >
            Sign in to message
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="label text-ink-3 hover:text-ink-2 transition-colors duration-[120ms]"
          >
            Keep looking
          </button>
        </div>
      </div>
    </div>
  );
}
