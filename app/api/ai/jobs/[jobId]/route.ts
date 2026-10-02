import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Polled by the client while AI work runs. RLS limits reads to the job's owner. */
export async function GET(_: Request, ctx: RouteContext<"/api/ai/jobs/[jobId]">) {
  if (!(await getUser())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { jobId } = await ctx.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("generation_jobs")
    .select("id, kind, status, progress, message, error, updated_at")
    .eq("id", jobId)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
