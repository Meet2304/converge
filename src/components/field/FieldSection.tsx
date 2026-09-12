"use client"

import type { ReactNode } from "react"
import { useFieldClaim } from "./FieldProvider"

/**
 * A section that claims the field while it owns the viewport centre.
 *
 * Pass the same number for `from` and `to` when the section simply holds a
 * convergence rather than driving one.
 */
export function FieldSection({
  from,
  to,
  className = "",
  children,
  id,
}: {
  from: number
  to?: number
  className?: string
  children: ReactNode
  id?: string
}) {
  const ref = useFieldClaim({ from, to: to ?? from })
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  )
}
