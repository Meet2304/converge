import Link from "next/link";
import { loginPath } from "@/lib/auth/paths";
import { getSession } from "@/lib/auth/session";

export async function AppHeader() {
  const session = await getSession();

  return (
    <header className="border-line bg-void/80 sticky top-0 z-40 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-xl md:px-8">
      <Link
        href="/"
        className="text-ink font-[family-name:var(--font-display)] text-[18px] tracking-[-0.01em]"
      >
        Converge
      </Link>
      <nav className="flex items-center gap-2">
        <Link
          href="/org"
          className="label text-ink-2 hover:text-ink rounded-[10px] px-3 py-2 transition-colors"
        >
          Organize
        </Link>
        {session?.user ? (
          <>
            <span className="text-ink-3 hidden text-sm sm:inline">
              {session.user.displayName || session.user.email}
            </span>
            <Link
              href="/api/auth/logout"
              className="label text-ink-2 hover:text-ink rounded-[10px] border border-transparent px-3 py-2 transition-colors hover:border-[var(--line)]"
            >
              Sign out
            </Link>
          </>
        ) : (
          <Link
            href={loginPath("/org")}
            className="bg-ink text-void rounded-[10px] px-3 py-2 font-[family-name:var(--font-display)] text-sm font-semibold"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
