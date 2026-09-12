"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";
// The field has one implementation. Do not reimplement it — AGENTS.md.
// Types come from the module's own JSDoc; there is no separate .d.ts to drift.
import { createField } from "@/lib/field/renderer.js";

export type FieldHandle = NonNullable<ReturnType<typeof createField>>;

/**
 * A section's claim on the field while it owns the viewport centre.
 *
 * `from` → `to` is convergence over the section's travel. `resolve` lets a
 * section take the wheel — a demo that is simulating a walk, say — and
 * returns `null` to hand it back. `gain` and `ox`/`oy` lean the whole field
 * for that surface, so sections stop sharing one identical backdrop.
 */
export type FieldClaim = {
  from: number;
  to: number;
  gain?: number;
  ox?: number;
  oy?: number;
  resolve?: (progress: number) => number | null;
};

type Registry = Map<Element, FieldClaim>;

type FieldContextValue = {
  register: (el: Element, claim: FieldClaim) => () => void;
  /** Re-run the scroll measurement now — for claims whose `resolve` changed. */
  measure: () => void;
  /** The live renderer, or null before mount / without WebGL2. */
  field: () => FieldHandle | null;
};

const FieldContext = createContext<FieldContextValue | null>(null);

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * One fixed canvas behind the entire page.
 *
 * Sections do not transition into each other — the background is continuous
 * and only content moves. It also keeps us inside field.md §5: one Tier 1
 * field per route, one WebGL context, one rAF loop.
 */
export function FieldProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<FieldHandle | null>(null);
  const registry = useRef<Registry>(new Map());
  const frame = useRef(0);

  const measureNow = useCallback(() => {
    frame.current = 0;
    const field = fieldRef.current;
    if (!field) return;
    const vh = window.innerHeight;
    const mid = vh / 2;

    let best: { claim: FieldClaim; progress: number } | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const [el, claim] of registry.current) {
      const rect = el.getBoundingClientRect();
      const progress = clamp01((vh - rect.top) / (rect.height + vh));
      const distance =
        rect.top <= mid && rect.bottom >= mid
          ? 0
          : Math.min(Math.abs(rect.top - mid), Math.abs(rect.bottom - mid));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { claim, progress };
      }
    }
    if (!best) return;

    const { claim, progress } = best;
    const override = claim.resolve?.(progress);
    const convergence = override ?? claim.from + (claim.to - claim.from) * progress;
    field.setScrollConvergence(convergence);
    field.setSection({ gain: claim.gain ?? 1, ox: claim.ox ?? 0, oy: claim.oy ?? 0 });
  }, []);

  const measure = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(measureNow);
  }, [measureNow]);

  const register = useCallback(
    (el: Element, claim: FieldClaim) => {
      registry.current.set(el, claim);
      measure();
      return () => {
        registry.current.delete(el);
      };
    },
    [measure],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Returns null without WebGL2 rather than throwing — the page stays
    // usable on a black ground, which is the baked-still fallback case.
    const field: FieldHandle | null = createField(canvas, {
      convergence: 0.25,
      influence: 0.5,
      ambient: true,
    });
    fieldRef.current = field;
    window.dispatchEvent(new CustomEvent("converge:field-ready"));
    if (!field) return;

    measureNow();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      field.destroy();
      fieldRef.current = null;
    };
  }, [measure, measureNow]);

  return (
    <FieldContext.Provider value={{ register, measure, field: () => fieldRef.current }}>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: the canvas is purely
          decorative — no tabindex, no interactive content, pointer-events off.
          Everything it shows exists as text elsewhere on the page. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      />
      {children}
    </FieldContext.Provider>
  );
}

export function useField() {
  const ctx = useContext(FieldContext);
  return {
    field: ctx?.field ?? (() => null),
    measure: ctx?.measure ?? (() => {}),
  };
}

/**
 * Claim the field for the lifetime of a section. The claim object is read
 * live, so a section can mutate `resolve` through a ref and call `measure()`.
 */
export function useFieldClaim(claim: FieldClaim) {
  const ctx = useContext(FieldContext);
  const ref = useRef<HTMLElement>(null);
  const live = useRef(claim);
  live.current = claim;

  useEffect(() => {
    const el = ref.current;
    if (!el || !ctx) return;
    // Register a proxy that always reads the latest claim, so callers can
    // change `resolve` without re-registering.
    const proxy: FieldClaim = {
      get from() {
        return live.current.from;
      },
      get to() {
        return live.current.to;
      },
      get gain() {
        return live.current.gain;
      },
      get ox() {
        return live.current.ox;
      },
      get oy() {
        return live.current.oy;
      },
      resolve: (p) => live.current.resolve?.(p) ?? null,
    };
    return ctx.register(el, proxy);
  }, [ctx]);

  return ref;
}
