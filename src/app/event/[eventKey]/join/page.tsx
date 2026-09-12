import Link from "next/link"
import { notFound } from "next/navigation"
import { joinEvent } from "@/app/actions/join"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getRequestContext } from "@/lib/auth/context"
import { getEventByKey, getMyParticipation } from "@/lib/db/events"

export default async function JoinPage({
  params,
}: {
  params: Promise<{ eventKey: string }>
}) {
  const { eventKey } = await params
  const event = await getEventByKey(eventKey)
  if (!event) notFound()
  const ctx = await getRequestContext()
  const mine = await getMyParticipation(event.id, {
    userId: ctx.user?.id,
    anonSessionId: ctx.anonSessionId,
  })

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{event.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Join</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href={`/event/${event.share_code}`} />}>
          Event
        </Button>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Minimum profile</CardTitle>
          <CardDescription>
            Nickname + avatar are generated (Grok stubs). Resume/Grok never block Join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={joinEvent} className="grid gap-3">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" placeholder="fullstack, designer…" defaultValue={mine?.role || ""} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="experience">Experience</Label>
              <select
                id="experience"
                name="experience"
                defaultValue={mine?.experience || "some"}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="first">First hackathon</option>
                <option value="some">Some experience</option>
                <option value="experienced">Experienced</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="desiredTeamSize">Desired team size</Label>
              <Input
                id="desiredTeamSize"
                name="desiredTeamSize"
                type="number"
                min={1}
                max={event.max_team_size}
                defaultValue={mine?.desired_team_size || Math.min(4, event.max_team_size)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input id="skills" name="skills" placeholder="react, python, figjam" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="affiliation">Affiliation</Label>
              <Input id="affiliation" name="affiliation" defaultValue={mine?.affiliation || ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={3} defaultValue={mine?.bio || ""} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="looking" value="true" defaultChecked={mine?.looking ?? true} />
              Looking for teammates
            </label>
            <Button type="submit">{mine ? "Save profile" : "Join event"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
