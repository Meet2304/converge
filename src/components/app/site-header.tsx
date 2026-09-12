import Link from "next/link";
import { DevLoginButton } from "@/components/app/dev-login-button";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Converge
      </Link>
      <nav className="flex items-center gap-2">
        <Button variant="ghost" nativeButton={false} render={<Link href="/org" />}>
          Organize
        </Button>
        {session?.user ? (
          <>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.displayName || session.user.email}
            </span>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/api/auth/logout" />}
            >
              Sign out
            </Button>
          </>
        ) : (
          <DevLoginButton />
        )}
      </nav>
    </header>
  );
}
