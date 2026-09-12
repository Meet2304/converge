import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createEvent } from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth/context";
import { loginPath } from "@/lib/auth/paths";
import type { SessionUser } from "@/lib/auth/types";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  let user: SessionUser;
  try {
    user = await requireUser();
  } catch {
    redirect(loginPath(`/org/${orgId}`));
  }

  const db = createAdminClient();
  const { data: membership } = await db
    .from("org_memberships")
    .select("role, organizations(*)")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const org = membership.organizations as unknown as { id: string; name: string; slug: string };
  const { data: events } = await db
    .from("events")
    .select("id, name, share_code, starts_at, map_enabled, looking_opens_at")
    .eq("org_id", orgId)
    .order("starts_at", { ascending: false });

  const now = new Date();
  const startDefault = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
  const endDefault = new Date(now.getTime() + 86400000 * 2).toISOString().slice(0, 16);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Organization</p>
          <h1 className="text-3xl font-semibold tracking-tight">{org.name}</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/org" />}>
          All orgs
        </Button>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-medium">Events</h2>
        {(events ?? []).map((ev) => (
          <Card key={ev.id} className="border-white/10">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{ev.name}</CardTitle>
                <CardDescription>
                  Code {ev.share_code} · map {ev.map_enabled ? "on" : "off"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/event/${ev.share_code}`} />}
                >
                  Public
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href={`/org/${orgId}/events/${ev.id}`} />}
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Create event</CardTitle>
          <CardDescription>Produces share link + copy + code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="grid gap-3">
            <input type="hidden" name="orgId" value={orgId} />
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shortDescription">Short description</Label>
              <Input id="shortDescription" name="shortDescription" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="longDescription">Long description</Label>
              <Textarea id="longDescription" name="longDescription" rows={4} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="venueName">Venue</Label>
                <Input id="venueName" name="venueName" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="venueAddress">Address</Label>
                <Input id="venueAddress" name="venueAddress" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="startsAt">Starts</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={startDefault}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="endsAt">Ends</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={endDefault}
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="lookingOpensAt">Looking opens</Label>
                <Input
                  id="lookingOpensAt"
                  name="lookingOpensAt"
                  type="datetime-local"
                  defaultValue={startDefault}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="minTeamSize">Min team</Label>
                <Input id="minTeamSize" name="minTeamSize" type="number" defaultValue={1} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="maxTeamSize">Max team</Label>
                <Input id="maxTeamSize" name="maxTeamSize" type="number" defaultValue={4} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue="America/New_York" />
            </div>
            <Button type="submit">Create event</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
