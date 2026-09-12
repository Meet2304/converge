import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OrgHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Org mode</p>
          <h1 className="text-3xl font-semibold tracking-tight">Organizer shell</h1>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create event</CardTitle>
          <CardDescription>
            Placeholder for org onboarding. Wire Auth0 before writes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled type="button">
            Create event (soon)
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
