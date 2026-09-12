import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sendMessage } from "@/app/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/context";
import type { SessionUser } from "@/lib/auth/types";
import { getEventByKey, getMyParticipation } from "@/lib/db/events";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ eventKey: string; conversationId: string }>;
}) {
  const { eventKey, conversationId } = await params;
  const event = await getEventByKey(eventKey);
  if (!event) notFound();
  if (!event.chat_enabled) {
    return <main className="p-10">Chat is disabled for this event.</main>;
  }

  let user: SessionUser;
  try {
    user = await requireUser();
  } catch {
    redirect(`/?login=1&returnTo=/event/${eventKey}/chat/${conversationId}`);
  }

  const mine = await getMyParticipation(event.id, {
    userId: user.id,
    anonSessionId: "",
  });
  if (!mine) redirect(`/event/${event.share_code}/join`);

  const db = createAdminClient();
  const { data: member } = await db
    .from("conversation_members")
    .select("participation_id")
    .eq("conversation_id", conversationId)
    .eq("participation_id", mine.id)
    .maybeSingle();
  if (!member) notFound();

  const { data: messages } = await db
    .from("messages")
    .select("id, body, created_at, sender_participation_id, participations(nickname)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/event/${event.share_code}`} />}
        >
          Event
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-3 rounded-lg border border-white/10 p-4">
        {(messages ?? []).map((m) => {
          const mineMsg = m.sender_participation_id === mine.id;
          const nick = (m.participations as { nickname?: string } | null)?.nickname || "Someone";
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mineMsg ? "ml-auto bg-white text-black" : "bg-white/10"}`}
            >
              {!mineMsg ? <p className="mb-1 text-xs text-muted-foreground">{nick}</p> : null}
              <p>{m.body}</p>
            </div>
          );
        })}
      </div>
      <form action={sendMessage} className="flex gap-2">
        <input type="hidden" name="conversationId" value={conversationId} />
        <Input name="body" placeholder="Message…" required autoComplete="off" />
        <Button type="submit">Send</Button>
      </form>
    </main>
  );
}
