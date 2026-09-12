import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateDemoEventButton, CreateOrganizationForm } from "@/components/app/org-home-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/context";
import { loginPath } from "@/lib/auth/paths";
import type { SessionUser } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OrgHomePage() {
  let user: SessionUser;
  try {
    user = await requireUser();
  } catch {
    redirect(loginPath("/org"));
  }

  const db = createAdminClient();
  const { data: memberships } = await db
    .from("org_memberships")
    .select("role, organizations(*)")
    .eq("user_id", user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Organizer</p>
          <h1 className="text-3xl font-semibold tracking-tight">Your organizations</h1>
        </div>
        <CreateDemoEventButton />
      </div>

      <div className="grid gap-4">
        {(memberships ?? []).map((m) => {
          const raw = m.organizations as unknown;
          const org = (Array.isArray(raw) ? raw[0] : raw) as
            | { id: string; name: string; slug: string }
            | undefined;
          if (!org) return null;
          return (
            <Card key={org.id} className="border-white/10">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>
                    /{org.slug} · {m.role}
                  </CardDescription>
                </div>
                <Button nativeButton={false} render={<Link href={`/org/${org.id}`} />}>
                  Open
                </Button>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>
            You become the sole owner. Soft cap 10 events (not shown publicly).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </main>
  );
}
