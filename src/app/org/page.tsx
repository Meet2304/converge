import Link from "next/link";
import { redirect } from "next/navigation";
import { createOrganization } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth/context";
import type { SessionUser } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OrgHomePage() {
  let user: SessionUser;
  try {
    user = await requireUser();
  } catch {
    redirect("/?login=1&returnTo=/org");
  }

  const db = createAdminClient();
  const { data: memberships } = await db
    .from("org_memberships")
    .select("role, organizations(*)")
    .eq("user_id", user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-sm text-muted-foreground">Organizer</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your organizations</h1>
      </div>

      <div className="grid gap-4">
        {(memberships ?? []).map((m) => {
          const org = m.organizations as unknown as { id: string; name: string; slug: string };
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
          <form action={createOrganization} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="https://" />
            </div>
            <Button type="submit">Create org</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
