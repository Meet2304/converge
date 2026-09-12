"use client"

import { useEffect, useState, type RefObject } from "react"

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/**
 * How far a section has travelled through the viewport, 0 → 1.
 *
 * 0 when its top reaches the bottom of the viewport, 1 when its bottom clears
 * the top. Nothing pins and nothing snaps — the page scrolls normally and this
 * only reports where things are.
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      setProgress(clamp01((vh - rect.top) / (rect.height + vh)))
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
    }
  }, [ref])

  return progress
}
