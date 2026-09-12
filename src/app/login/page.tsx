import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/login-form";
import { safeReturnTo } from "@/lib/auth/paths";
import { auth0Configured, getSession } from "@/lib/auth/session";

const LOGIN_ERRORS: Record<string, string> = {
  auth0:
    "Google sign-in is misconfigured for this domain. Use Continue below, or ask an admin to set Auth0 callbacks to converge.meetbhatt.com.",
  token:
    "Google sign-in could not be completed. The Auth0 callback URL must be https://converge.meetbhatt.com/api/auth/callback.",
  userinfo: "Google signed in, but we could not read your profile. Try again.",
  auth: "Google sign-in was cancelled.",
  "auth-unavailable": "Google sign-in is not available right now.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(sp.returnTo, "/org");
  const session = await getSession();
  if (session?.user) redirect(returnTo);
  const errorMessage = sp.error
    ? (LOGIN_ERRORS[sp.error] ?? "Sign-in failed. Try Continue below.")
    : null;

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
      {errorMessage ? <p className="body-s text-danger">{errorMessage}</p> : null}
      <LoginForm returnTo={returnTo} googleEnabled={auth0Configured()} />
    </main>
  );
}
