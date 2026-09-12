import Link from "next/link";
import { FieldSection } from "@/components/field/FieldSection";

const REPO = "https://github.com/Meet2304/converge";

/**
 * The pre-event side, kept deliberately quiet so nobody concludes Converge is
 * only a day-of map. No scroll animation here — Find owns that.
 */
export function PreEventSection() {
  const beats = [
    {
      term: "Looking",
      copy: "See who else needs a team. Sorted by who joined most recently — no scores, no ranking.",
    },
    {
      term: "Match",
      copy: "Like the people you'd want to build with. When it's mutual, it's a match, and you can talk.",
    },
    {
      term: "Team",
      copy: "Form a team before the doors open. Every team gets a group chat.",
    },
  ];

  return (
    <FieldSection id="before" from={0.5} className="px-5 py-32">
      <div className="mx-auto w-full max-w-[720px]">
        <h2 className="display-m text-ink">Before the doors open.</h2>
        <dl className="mt-12 space-y-0">
          {beats.map(({ term, copy }) => (
            <div
              key={term}
              className="border-line-quiet grid gap-2 border-t py-6 last:border-b md:grid-cols-[140px_1fr] md:gap-8"
            >
              <dt className="heading-s text-ink">{term}</dt>
              <dd className="body text-ink-2">{copy}</dd>
            </div>
          ))}
        </dl>
      </div>
    </FieldSection>
  );
}

export function OrganizationsSection() {
  const controls = [
    "Tracks, and when their names go public",
    "Maximum team size",
    "When Looking opens",
    "Whether the map is on, and when it switches off",
  ];

  return (
    <FieldSection id="organizers" from={0.35} className="px-5 py-32">
      <div className="mx-auto w-full max-w-[720px]">
        <h2 className="display-m text-ink">Running a hackathon?</h2>
        <p className="body-l text-ink-2 measure mt-5">
          Create an event, share one link, and watch teams form.
        </p>

        <ul className="mt-10 space-y-0">
          {controls.map((control) => (
            <li
              key={control}
              className="body-s text-ink-3 border-line-quiet border-t py-3 last:border-b"
            >
              {control}
            </li>
          ))}
        </ul>

        <Link
          href="/org"
          className="border-line text-ink hover:border-line-loud mt-10 inline-flex h-12 items-center rounded-[10px] border px-5 font-[family-name:var(--font-display)] text-[16px] font-semibold transition-colors duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)]"
        >
          Create an event
        </Link>
      </div>
    </FieldSection>
  );
}

/**
 * The trust section. The privacy facts live here because the open licence and
 * the privacy rules reinforce each other — every line below is locked
 * behaviour in auth.md or day-of.md, not a promise.
 */
export function OpenSourceSection() {
  const facts = [
    "Your name stays hidden until you sign in. So does everyone else's.",
    "Your location is off until you turn it on, and it switches off when the event ends.",
    "On a team, only your teammates can see where you are.",
  ];

  return (
    <FieldSection id="open-source" from={0.2} className="px-5 py-32">
      <div className="mx-auto w-full max-w-[720px]">
        <h2 className="display-m text-ink">Open source, under AGPL-3.0.</h2>
        <p className="body-l text-ink-2 measure mt-5">
          The code is public and always will be. AGPL means anyone running Converge — including us —
          has to publish their changes, so it can&rsquo;t quietly become something else.
        </p>

        <ul className="mt-10 space-y-0">
          {facts.map((fact) => (
            <li
              key={fact}
              className="body text-ink-2 border-line-quiet border-t py-4 last:border-b"
            >
              {fact}
            </li>
          ))}
        </ul>

        <Link
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="border-line text-ink hover:border-line-loud mt-10 inline-flex h-12 items-center rounded-[10px] border px-5 font-[family-name:var(--font-display)] text-[16px] font-semibold transition-colors duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)]"
        >
          Read the code
        </Link>
      </div>
    </FieldSection>
  );
}

export function Footer() {
  return (
    <FieldSection from={0.15} className="px-5 pt-40 pb-16">
      <div className="mx-auto w-full max-w-[720px]">
        {/* Space is what makes this majestic. Size alone would just be loud. */}
        <p className="display-m text-ink text-center">Made by Humans, on Earth</p>

        <div className="border-line-quiet mt-32 flex items-center justify-between border-t pt-6">
          <span className="label text-ink-3">Converge</span>
          <nav className="flex gap-6">
            <Link
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="label text-ink-3 hover:text-ink-2 transition-colors duration-[120ms]"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </FieldSection>
  );
}
