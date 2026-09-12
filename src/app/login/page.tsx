import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/login-form";
import { safeReturnTo } from "@/lib/auth/paths";
import { getSession, googleAuthEnabled } from "@/lib/auth/session";

const LOGIN_ERRORS: Record<string, string> = {
  google: "Google sign-in is not enabled on this project yet. Create an account with email below.",
  auth: "Sign-in was cancelled or failed. Try email instead.",
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
    ? (LOGIN_ERRORS[sp.error] ?? "Sign-in failed. Try again with email.")
    : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="label text-ink-3 mb-3">Organizer</p>
        <h1 className="display-m text-ink">Sign in</h1>
        <p className="body-s text-ink-2 mt-3">
          Create an account with email to publish an event and share a code. Candidates can join
          without an account.
        </p>
      </div>
      {errorMessage ? <p className="body-s text-danger">{errorMessage}</p> : null}
      <LoginForm returnTo={returnTo} googleEnabled={googleAuthEnabled()} />
    </main>
  );
}
