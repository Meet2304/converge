import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { acceptInvite, createTeam } from "@/app/actions/team"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireUser } from "@/lib/auth/context"
import { getEventByKey, getMyParticipation } from "@/lib/db/events"

export default async function TeamIndexPage({
  params,
}: {
  params: Promise<{ eventKey: string }>
}) {
  const { eventKey } = await params
  const event = await getEventByKey(eventKey)
  if (!event) notFound()
  let user
  try {
    user = await requireUser()
  } catch {
    redirect(`/?login=1&returnTo=/event/${eventKey}/team`)
  }
  const mine = await getMyParticipation(event.id, { userId: user.id, anonSessionId: "" })
  if (!mine) redirect(`/event/${event.share_code}/join`)
  if (mine.current_team_id) redirect(`/event/${event.share_code}/team/${mine.current_team_id}`)

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Create a team</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeam} className="grid gap-3">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="grid gap-1.5">
              <Label htmlFor="name">Team name</Label>
              <Input id="name" name="name" required />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Join with invite code</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={acceptInvite} className="grid gap-3">
            <Input name="code" placeholder="Invite code" required />
            <Button type="submit" variant="secondary">
              Accept invite
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}`} />}>
        Back
      </Button>
    </main>
  )
}
