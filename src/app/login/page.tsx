import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/login-form";
import { safeReturnTo } from "@/lib/auth/paths";
import { auth0Configured, getSession } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(sp.returnTo, "/org");
  const session = await getSession();
  if (session?.user) redirect(returnTo);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="label text-ink-3 mb-3">Organizer</p>
        <h1 className="display-m text-ink">Sign in</h1>
        <p className="body-s text-ink-2 mt-3">
          Create an organization, publish an event, and share a code. Candidates can join without an
          account.
        </p>
      </div>
      <LoginForm returnTo={returnTo} googleEnabled={auth0Configured()} />
    </main>
  );
}
