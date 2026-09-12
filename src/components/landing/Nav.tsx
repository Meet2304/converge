import Link from "next/link";
import { loginPath } from "@/lib/auth/paths";
import { getSession } from "@/lib/auth/session";

/**
 * Floats at the very top over the progressive blur. Never a solid bar, and it
 * does not hide or shrink on scroll — movement there would compete with the
 * field for attention.
 */
export async function Nav() {
  const session = await getSession();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-8">
      <Link
        href="/"
        className="text-ink rounded-[6px] font-[family-name:var(--font-display)] text-[18px] font-normal tracking-[-0.01em]"
      >
        Converge
      </Link>
      <nav className="flex items-center gap-2">
        {session?.user ? (
          <Link
            href="/org"
            className="bg-ink text-void rounded-[10px] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold"
          >
            Your events
          </Link>
        ) : (
          <>
            <Link
              href={loginPath("/org")}
              className="label text-ink-2 hover:text-ink rounded-[10px] px-3 py-2 transition-colors duration-[120ms] ease-[cubic-bezier(.16,1,.3,1)]"
            >
              Sign in
            </Link>
            <Link
              href={loginPath("/org")}
              className="bg-ink text-void rounded-[10px] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold"
            >
              Create an event
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
