"use client";

import type { ReactNode } from "react";
import { type FieldClaim, useFieldClaim } from "./FieldProvider";

/**
 * A section that claims the field while it owns the viewport centre.
 *
 * Pass the same number for `from` and `to` when the section simply holds a
 * convergence. `gain`, `ox` and `oy` lean the field for this surface.
 */
export function FieldSection({
  from,
  to,
  gain,
  ox,
  oy,
  className = "",
  children,
  id,
}: Omit<FieldClaim, "to" | "resolve"> & {
  to?: number;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const ref = useFieldClaim({ from, to: to ?? from, gain, ox, oy });
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  );
}
