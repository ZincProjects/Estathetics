import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AiOutputError, AiRefusalError } from "./claude";
import { RateLimitedError } from "./usage";

/** Maps AI/infra failures to friendly, non-leaky responses. */
export function aiErrorResponse(e: unknown, action: string) {
  if (e instanceof RateLimitedError) return NextResponse.json({ error: e.message }, { status: 429 });
  if (e instanceof AiRefusalError) {
    return NextResponse.json({ error: "The AI couldn't complete this request. Try different input." }, { status: 422 });
  }
  if (e instanceof AiOutputError) {
    return NextResponse.json({ error: "The AI response came back incomplete. Please try again." }, { status: 502 });
  }
  if (e instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "Our AI is busy right now. Please try again in a minute." }, { status: 503 });
  }
  if (e instanceof Anthropic.AuthenticationError) {
    console.error("Anthropic auth failed. Check ANTHROPIC_API_KEY.");
    return NextResponse.json({ error: "AI is not configured correctly." }, { status: 500 });
  }
  console.error(`${action} failed`, e);
  return NextResponse.json({ error: `Something went wrong while ${action}. Please try again.` }, { status: 500 });
}
