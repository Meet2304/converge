"use client";

import { useEffect, useState } from "react";

// Hard ceiling. A failed shader compile must never trap anyone on a loading
// screen, and 2.5s of black is already longer than it feels.
const MAX_WAIT = 1800;

// Lets visual tests capture the page itself rather than the loading state.
const SKIP = process.env.NEXT_PUBLIC_SKIP_LOADER === "1";

/**
 * The loader becomes the hero rather than being replaced by it: a hairline
 * grows at the centre, then opens outward as the field takes over.
 *
 * Two rules keep it from being annoying. It never flashes — the line carries
 * a 250ms animation delay, so a fast load unmounts it before anything is
 * visible. And it hard-stops at 2.5s, so a failed shader compile can never
 * trap someone on a loading screen.
 */
export function Loader() {
  const [done, setDone] = useState(SKIP);
  const [gone, setGone] = useState(SKIP);

  useEffect(() => {
    if (SKIP) return;
    let cancelled = false;

    const fieldReady = new Promise<void>((resolve) => {
      window.addEventListener("converge:field-ready", () => resolve(), {
        once: true,
      });
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const ceiling = new Promise<void>((resolve) => setTimeout(resolve, MAX_WAIT));

    Promise.race([Promise.all([fieldReady, fontsReady]).then(() => undefined), ceiling]).then(
      () => {
        if (!cancelled) setDone(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-busy={!done}
      data-done={done || undefined}
      className="bg-void fixed inset-0 z-50 grid place-items-center transition-opacity duration-500 ease-[cubic-bezier(.16,1,.3,1)] data-done:pointer-events-none data-done:opacity-0"
    >
      <span className="sr-only">Loading</span>
      <div
        aria-hidden="true"
        data-done={done || undefined}
        data-keep-motion
        className="animate-[loader-grow_1400ms_cubic-bezier(.16,1,.3,1)_250ms_both] h-px bg-white/70 transition-[width,opacity] duration-[600ms] ease-[cubic-bezier(.16,1,.3,1)] data-done:w-screen data-done:opacity-0"
      />
    </div>
  );
}
