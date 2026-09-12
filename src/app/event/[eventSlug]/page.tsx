import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type EventShellPageProps = {
  params: Promise<{ eventSlug: string }>
}

export default async function EventShellPage({ params }: EventShellPageProps) {
  const { eventSlug } = await params

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Event shell</p>
          <h1 className="text-3xl font-semibold tracking-tight">{eventSlug}</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Home
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Looking</CardTitle>
            <CardDescription>Candidate browse list placeholder.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled type="button">
              Join (soon)
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Team formation placeholder.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="secondary" type="button">
              Create team (soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
