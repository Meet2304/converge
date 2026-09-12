"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useField, useFieldClaim } from "@/components/field/FieldProvider";
import { JoinPanel } from "./JoinPanel";

/**
 * Centred, because a field moment is symmetric about its waist and the type
 * sits at the convergence point — form.md §6.
 *
 * The beams close as the code fills in: the one interaction on the page
 * drives the identity, and it is honest feedback rather than an effect.
 */
export function Hero() {
  const { measure } = useField();
  const typed = useRef(0.25);
  const [, force] = useState(0);

  const ref = useFieldClaim({
    from: 0.25,
    to: 0.25,
    resolve: () => typed.current,
  });

  const onConvergence = useCallback((v: number) => {
    typed.current = v;
    force((n) => n + 1);
  }, []);

  useEffect(() => {
    measure();
  });

  return (
    <section
      ref={ref}
      className="flex min-h-dvh flex-col items-center justify-center gap-10 px-5 py-28"
    >
      <h1 className="display-xl text-ink text-center">Converge</h1>
      <JoinPanel onConvergence={onConvergence} />
      <p className="body-s text-ink-3 text-center">
        Got a link? Just open it — you won&rsquo;t need a code.
      </p>
    </section>
  );
}
