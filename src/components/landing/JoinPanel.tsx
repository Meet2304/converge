"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
import { useField } from "@/components/field/FieldProvider";

const CODE_LENGTH = 6;

/**
 * Pulls a code out of whatever someone pasted.
 *
 * Accepting a full URL is the highest-value forgiveness behaviour on the page:
 * people copy the link they were given, not the fragment at the end of it.
 */
export function normalizeCode(raw: string): string {
  let value = raw.trim();

  const match = value.match(/\/(?:e|event)\/([^/?#\s]+)/i);
  if (match) value = match[1];
  else if (/^https?:\/\//i.test(value)) {
    const tail = value.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop();
    if (tail) value = tail;
  }

  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function JoinPanel({
  onConvergence,
}: {
  /** Hero convergence as the code fills in — the beams close as you type. */
  onConvergence?: (v: number) => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { field } = useField();

  useEffect(() => {
    const filled = Math.min(1, normalizeCode(value).length / CODE_LENGTH);
    onConvergence?.(0.22 + filled * 0.6);
  }, [value, onConvergence]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const code = normalizeCode(value);

    if (!code) {
      setError("Enter your event code.");
      return;
    }

    setError(null);
    // The beams close on the way out — you converged on an event.
    field()?.setConvergence(1, { bloom: true });
    // Lookup lands with Supabase; until then the event route resolves the
    // code and owns the "no event with that code" state.
    setTimeout(() => router.push(`/event/${encodeURIComponent(code.toLowerCase())}`), 650);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border-line bg-void/60 w-full max-w-[380px] rounded-[24px] border p-5 backdrop-blur-xl"
    >
      <label htmlFor={inputId} className="label text-ink-2 block">
        Event code
      </label>

      <input
        id={inputId}
        name="eventCode"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="code-l text-ink border-line focus-visible:border-line-loud mt-3 h-12 w-full rounded-[6px] border bg-black/40 px-3 uppercase transition-colors duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)]"
      />

      {error ? (
        <p id={errorId} role="alert" className="body-s text-danger mt-2">
          {error}
        </p>
      ) : (
        <p className="body-s text-ink-3 mt-2">
          From your organizer — on the slides, or in the invite.
        </p>
      )}

      <button
        type="submit"
        className="bg-ink text-void mt-4 h-12 w-full rounded-[10px] font-[family-name:var(--font-display)] text-[16px] font-semibold transition-opacity duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)] hover:opacity-90"
      >
        Open event
      </button>
    </form>
  );
}
