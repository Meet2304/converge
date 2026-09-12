"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldSection } from "@/components/field/FieldSection";
import { Avatar } from "./Avatar";

const REPO = "https://github.com/Meet2304/converge";
const SHARE_LINK = "converge.app/e/h4k92qx";
const EVENT_CODE = "H4K92QX";

/* --------------------------------------------------------------- organizers */

export function OrganizersSection() {
  const [lookingOpen, setLookingOpen] = useState(true);
  const [mapOn, setMapOn] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function copy(what: "link" | "code") {
    const text = what === "link" ? `https://${SHARE_LINK}` : EVENT_CODE;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <FieldSection
      id="organizers"
      from={0.3}
      to={0.42}
      gain={0.38}
      ox={0.22}
      className="relative flex min-h-dvh items-center px-5 py-28"
    >
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-14 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
        <div className="text-scrim">
          <h2 className="display-m text-ink">Running a hackathon?</h2>
          <p className="body-l text-ink-2 mt-5 max-w-[34ch]">
            Create an event, share one link, and watch teams form. You decide when Looking opens and
            whether the map is on at all.
          </p>
          <Link
            href="/org"
            className="border-line text-ink hover:border-line-loud mt-8 inline-flex h-12 items-center rounded-[10px] border px-5 font-[family-name:var(--font-display)] text-[16px] font-semibold transition-colors duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)]"
          >
            Create an event
          </Link>
        </div>

        <div className="border-line bg-void/55 overflow-hidden rounded-[24px] border backdrop-blur-xl">
          <div className="border-line-quiet flex items-baseline justify-between border-b px-5 py-4">
            <span className="heading-s text-ink">Nightshift 2026</span>
            <span className="body-s text-ink-3">Sat 14 Mar · Beacon Works</span>
          </div>

          {/* One Share block — link, copy, code. Not competing modes (3.4). */}
          <div className="border-line-quiet space-y-3 border-b px-5 py-5">
            <div className="border-line flex items-center gap-3 rounded-[10px] border px-3 py-2.5">
              <span className="code text-ink-2 min-w-0 flex-1 truncate">{SHARE_LINK}</span>
              <button
                type="button"
                onClick={() => copy("link")}
                className="label text-ink-2 hover:text-ink shrink-0 transition-colors duration-[120ms]"
              >
                {copied === "link" ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => copy("code")}
              className="border-line hover:border-line-loud flex w-full items-center justify-between rounded-[10px] border px-3 py-3 transition-colors duration-[120ms]"
            >
              <span className="code-l text-ink">{EVENT_CODE}</span>
              <span className="label text-ink-3">
                {copied === "code" ? "Copied" : "Event code"}
              </span>
            </button>
          </div>

          <div className="border-line-quiet grid grid-cols-3 border-b">
            {[
              ["Joined", "48"],
              ["Looking", lookingOpen ? "31" : "—"],
              ["Teams", "7"],
            ].map(([label, value]) => (
              <div key={label} className="border-line-quiet border-r px-5 py-4 last:border-r-0">
                <p className="code-l text-ink tabular-nums">{value}</p>
                <p className="body-s text-ink-3 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="divide-line-quiet divide-y">
            <ControlRow
              label="Looking is open"
              detail={
                lookingOpen
                  ? "People can show they need a team."
                  : "Nobody appears on the list yet."
              }
              on={lookingOpen}
              onChange={setLookingOpen}
            />
            <ControlRow
              label="Live map"
              detail={
                mapOn
                  ? "On now. Switches off when the event ends."
                  : "Off. Turn it on when doors open."
              }
              on={mapOn}
              onChange={setMapOn}
            />
          </div>
        </div>
      </div>
    </FieldSection>
  );
}

function ControlRow({
  label,
  detail,
  on,
  onChange,
}: {
  label: string;
  detail: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="body text-ink">{label}</p>
        <p className="body-s text-ink-3 mt-0.5">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative block h-6 w-11 shrink-0 rounded-full transition-colors duration-[200ms] ${
          on ? "bg-ink" : "bg-ink-4"
        }`}
      >
        <span
          className={`bg-void absolute top-1 block h-4 w-4 rounded-full transition-[left] duration-[200ms] ease-[cubic-bezier(.16,1,.3,1)] ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- open source */

export function OpenSourceSection() {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <FieldSection
      id="open-source"
      from={0.18}
      to={0.26}
      gain={0.3}
      className="relative flex min-h-dvh items-center px-5 py-28"
    >
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
        <div className="order-2 lg:order-1">
          {/* The privacy rule is demonstrated rather than claimed: the same
              person, in the two access tiers, side by side with a switch. */}
          <div className="border-line bg-void/55 overflow-hidden rounded-[24px] border backdrop-blur-xl">
            <div className="border-line-quiet flex items-center justify-between gap-4 border-b px-5 py-4">
              <span className="body-s text-ink-3">Viewing as</span>
              <div className="border-line flex rounded-full border p-1">
                {[
                  ["Signed out", false],
                  ["Signed in", true],
                ].map(([label, value]) => (
                  <button
                    key={String(label)}
                    type="button"
                    onClick={() => setSignedIn(value as boolean)}
                    aria-pressed={signedIn === value}
                    className={`label rounded-full px-3 py-1.5 transition-colors duration-[200ms] ${
                      signedIn === value ? "bg-ink text-void" : "text-ink-3 hover:text-ink-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 px-5 py-5">
              <Avatar initials={signedIn ? "Q" : undefined} seed={4} size={48} />
              <div className="min-w-0 flex-1">
                <p className="heading-s text-ink leading-tight">
                  {signedIn ? "Quartz" : "Someone looking"}
                </p>
                <p className="body-s text-ink-3 mt-0.5">Design · A few · wants 3–4</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Figma", "Motion", "Research"].map((s) => (
                    <span
                      key={s}
                      className="body-s text-ink-2 border-line-quiet rounded-[6px] border px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-line-quiet border-t px-5 py-4">
              <p className="body-s text-ink-3">Links</p>
              <p className="body-s text-ink-2 mt-1">
                {signedIn ? "github.com/quartz · quartz.design" : "Hidden until you sign in"}
              </p>
            </div>
          </div>
        </div>

        <div className="text-scrim order-1 lg:order-2">
          <h2 className="display-m text-ink">You can read every line.</h2>
          <p className="body-l text-ink-2 mt-5 max-w-[34ch]">
            Converge is open source under AGPL-3.0 — anyone running it, us included, has to publish
            their changes. It can&rsquo;t quietly become something else.
          </p>

          <ul className="mt-8 max-w-[34ch] space-y-0">
            {[
              "Names stay hidden until you sign in.",
              "Location is off until you turn it on.",
              "On a team, only teammates see where you are.",
            ].map((fact) => (
              <li
                key={fact}
                className="body-s text-ink-2 border-line-quiet border-t py-3 last:border-b"
              >
                {fact}
              </li>
            ))}
          </ul>

          <Link
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="border-line text-ink hover:border-line-loud mt-8 inline-flex h-12 items-center rounded-[10px] border px-5 font-[family-name:var(--font-display)] text-[16px] font-semibold transition-colors duration-[120ms]"
          >
            Read the code
          </Link>
        </div>
      </div>
    </FieldSection>
  );
}

/* ------------------------------------------------------------------ footer */

export function Footer() {
  return (
    <FieldSection from={0.08} gain={0.26} oy={-0.3} className="relative px-5 pt-40 pb-14">
      <div className="mx-auto w-full max-w-[1080px]">
        {/* Space is what makes this land. Size alone would only be loud. */}
        <p className="display-l text-ink text-center">Made by Humans, on Earth</p>

        <div className="border-line-quiet mt-36 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
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
            <Link
              href="/org"
              className="label text-ink-3 hover:text-ink-2 transition-colors duration-[120ms]"
            >
              Create an event
            </Link>
          </nav>
        </div>
      </div>
    </FieldSection>
  );
}
