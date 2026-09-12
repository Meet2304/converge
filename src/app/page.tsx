import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 max-w-xl text-center">
        <p className="mb-3 text-sm tracking-[0.2em] text-muted-foreground uppercase">
          Converge
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Find your hackathon team
        </h1>
        <p className="mt-4 text-base text-muted-foreground text-pretty">
          Join an event with a code, meet people looking for teammates, and find
          each other on the map day-of.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter event code</CardTitle>
          <CardDescription>
            Skeleton shell — Auth0 and live events come next.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            name="eventCode"
            placeholder="e.g. HACK26"
            autoComplete="off"
            aria-label="Event code"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:flex-1" type="button">
            Continue
          </Button>
          <Button
            className="w-full sm:flex-1"
            variant="outline"
            nativeButton={false}
            render={<Link href="/org" />}
          >
            Organize an event
          </Button>
        </CardFooter>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link className="underline-offset-4 hover:underline" href="/event/demo">
          Open demo event shell
        </Link>
      </p>
    </main>
  )
}
