"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
// The field has one implementation. Do not reimplement it — AGENTS.md.
// Types come from the module's own JSDoc; there is no separate .d.ts to drift.
import { createField } from "@/lib/field/renderer.js"

type FieldHandle = NonNullable<ReturnType<typeof createField>>

/** A section's claim on the field: convergence runs `from` → `to` as it passes. */
export type FieldClaim = { from: number; to: number }

type Registry = Map<Element, FieldClaim>

const FieldContext = createContext<{
  register: (el: Element, claim: FieldClaim) => () => void
} | null>(null)

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/**
 * One fixed canvas behind the entire page.
 *
 * Sections do not transition into each other — the background is continuous
 * and only content moves, which is where the smoothness comes from. It also
 * keeps us inside field.md §5: one Tier 1 field per route, one WebGL context,
 * one rAF loop.
 */
export function FieldProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<FieldHandle | null>(null)
  const registry = useRef<Registry>(new Map())

  const register = useCallback((el: Element, claim: FieldClaim) => {
    registry.current.set(el, claim)
    return () => {
      registry.current.delete(el)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Returns null without WebGL2 rather than throwing — the page stays
    // usable on a black ground, which is the baked-still fallback case.
    const field: FieldHandle | null = createField(canvas, {
      convergence: 0.25,
      influence: 0.5, // subtle: the waist drifts, it never chases
      ambient: true, // alive and breathing at any convergence
    })
    fieldRef.current = field

    window.dispatchEvent(new CustomEvent("converge:field-ready"))
    if (!field) return

    let frame = 0
    const measure = () => {
      frame = 0
      const vh = window.innerHeight
      const mid = vh / 2

      let best: { claim: FieldClaim; progress: number } | null = null
      let bestDistance = Infinity

      for (const [el, claim] of registry.current) {
        const rect = el.getBoundingClientRect()
        // 0 when the section's top hits the viewport bottom, 1 when its
        // bottom clears the top.
        const progress = clamp01((vh - rect.top) / (rect.height + vh))
        // The section owning the viewport centre wins; ties break on distance.
        const distance =
          rect.top <= mid && rect.bottom >= mid
            ? 0
            : Math.min(Math.abs(rect.top - mid), Math.abs(rect.bottom - mid))
        if (distance < bestDistance) {
          bestDistance = distance
          best = { claim, progress }
        }
      }

      if (!best) return
      const { from, to } = best.claim
      field.setScrollConvergence(from + (to - from) * best.progress)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      field.destroy()
      fieldRef.current = null
    }
  }, [])

  return (
    <FieldContext.Provider value={{ register }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      />
      {children}
    </FieldContext.Provider>
  )
}

/**
 * Claim the field for the lifetime of a section. `from`/`to` are convergence
 * values; pass the same number twice for a section that simply holds.
 */
export function useFieldClaim(claim: FieldClaim) {
  const ctx = useContext(FieldContext)
  const ref = useRef<HTMLElement>(null)
  const { from, to } = claim

  useEffect(() => {
    const el = ref.current
    if (!el || !ctx) return
    return ctx.register(el, { from, to })
  }, [ctx, from, to])

  return ref
}
