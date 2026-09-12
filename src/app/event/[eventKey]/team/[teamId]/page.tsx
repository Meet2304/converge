import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createInvite, kickMember, leaveTeam, renameTeam } from "@/app/actions/team";
import { CopyButton } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/context";
import type { SessionUser } from "@/lib/auth/types";
import { getEventByKey, getMyParticipation } from "@/lib/db/events";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ eventKey: string; teamId: string }>;
}) {
  const { eventKey, teamId } = await params;
  const event = await getEventByKey(eventKey);
  if (!event) notFound();
  let user: SessionUser;
  try {
    user = await requireUser();
  } catch {
    redirect(`/?login=1&returnTo=/event/${eventKey}/team/${teamId}`);
  }

  const db = createAdminClient();
  const { data: team } = await db
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!team || team.dissolved_at) notFound();

  const mine = await getMyParticipation(event.id, { userId: user.id, anonSessionId: "" });
  if (!mine) redirect(`/event/${event.share_code}/join`);

  const { data: members } = await db
    .from("team_members")
    .select("role, participation_id, participations(id, nickname, avatar_url)")
    .eq("team_id", teamId);
  const { data: invites } = await db
    .from("team_invites")
    .select("code, created_at, revoked_at, accepted_at")
    .eq("team_id", teamId)
    .is("revoked_at", null)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: convo } = await db
    .from("conversations")
    .select("id")
    .eq("team_id", teamId)
    .eq("kind", "team")
    .maybeSingle();

  const isCreator = team.creator_participation_id === mine.id;
  const onTeam = (members ?? []).some((m) => m.participation_id === mine.id);
  const needs = Math.max(event.max_team_size - (members ?? []).length, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{event.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {(members ?? []).length}/{event.max_team_size}
            {needs > 0 ? ` · needs ${needs}` : " · full"}
          </p>
        </div>
        {convo ? (
          <Button
            nativeButton={false}
            render={<Link href={`/event/${event.share_code}/chat/${convo.id}`} />}
          >
            Team chat
          </Button>
        ) : null}
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {(members ?? []).map((m) => {
            const p = m.participations as unknown as {
              id: string;
              nickname: string;
              avatar_url: string;
            };
            return (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar_url} alt="" className="size-8 rounded-full" />
                  <span className="text-sm">
                    {p.nickname} {m.role === "creator" ? "(creator)" : ""}
                  </span>
                </div>
                {isCreator && p.id !== mine.id ? (
                  <form action={kickMember}>
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="targetParticipationId" value={p.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Kick
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isCreator ? (
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle>Rename</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={renameTeam} className="flex gap-2">
              <input type="hidden" name="teamId" value={teamId} />
              <Input name="name" defaultValue={team.name} required />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {onTeam ? (
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle>Invites</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <form action={createInvite}>
              <input type="hidden" name="teamId" value={teamId} />
              <Button type="submit" variant="secondary">
                New invite code
              </Button>
            </form>
            {(invites ?? []).map((inv) => (
              <div key={inv.code} className="flex items-center gap-2">
                <code className="rounded bg-white/5 px-2 py-1">{inv.code}</code>
                <CopyButton value={inv.code} label="Copy" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {onTeam ? (
        <form action={leaveTeam} className="grid gap-2">
          <input type="hidden" name="teamId" value={teamId} />
          {isCreator && (members ?? []).length > 1 ? (
            <select
              name="transferTo"
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              required
            >
              <option value="">Transfer creator to…</option>
              {(members ?? [])
                .filter((m) => m.participation_id !== mine.id)
                .map((m) => {
                  const p = m.participations as unknown as { id: string; nickname: string };
                  return (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  );
                })}
            </select>
          ) : null}
          <Button type="submit" variant="destructive">
            {(members ?? []).length <= 1 ? "Dissolve team" : "Leave team"}
          </Button>
        </form>
      ) : null}
    </main>
  );
}
