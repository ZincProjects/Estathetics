import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { AiUsage } from "./claude";

/** Sliding-window limits per user. Tune here; Phase 4 tiers will read these per plan. */
export const RATE_LIMITS = {
  room_scan: { limit: 20, windowSeconds: 3600 },
  redesign: { limit: 10, windowSeconds: 3600 },
  listing_copy: { limit: 30, windowSeconds: 3600 },
  neighbourhood: { limit: 30, windowSeconds: 3600 },
} as const;

export type UsageKind = keyof typeof RATE_LIMITS;

export class RateLimitedError extends Error {
  constructor(public kind: UsageKind) {
    super(`You've reached the hourly limit for this action. Please try again later.`);
  }
}

/** Throws RateLimitedError when the user has used up their allowance for `kind`. */
export async function assertWithinRateLimit(supabase: ServerSupabase, kind: UsageKind) {
  const { limit, windowSeconds } = RATE_LIMITS[kind];
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_kind: kind,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (data === -1) throw new RateLimitedError(kind);
  return data;
}

export async function recordUsage(
  supabase: ServerSupabase,
  userId: string,
  kind: UsageKind,
  opts: { usage?: AiUsage; mocked: boolean; units?: number; meta?: Record<string, Json> },
) {
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    kind,
    units: opts.units ?? 1,
    mocked: opts.mocked,
    input_tokens: opts.usage?.inputTokens ?? null,
    output_tokens: opts.usage?.outputTokens ?? null,
    est_cost_usd: opts.usage?.costUsd ?? null,
    meta: { ...(opts.meta ?? {}), ...(opts.usage ? { model: opts.usage.model } : {}) },
  });
  if (error) console.error("recordUsage failed", error);
}
