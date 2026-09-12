import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ShortCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = createAdminClient();
  const { data } = await db
    .from("events")
    .select("share_code")
    .eq("share_code", code.toUpperCase())
    .maybeSingle();
  if (!data) redirect("/?error=code");
  redirect(`/event/${data.share_code}`);
}
