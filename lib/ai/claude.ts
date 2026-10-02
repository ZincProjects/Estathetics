import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/lib/env";

let client: Anthropic | undefined;
function getClient() {
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 120_000, maxRetries: 2 });
  return client;
}

/** Per-million-token USD prices for cost estimates in usage tracking. */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-fable-5-1": { input: 10, output: 50 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number) {
  const p = PRICING[model] ?? PRICING["claude-opus-5-5"];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

export class AiRefusalError extends Error {
  constructor(public category: string | null) {
    super("The AI declined this request.");
  }
}
export class AiOutputError extends Error {}

export type AiUsage = { model: string; inputTokens: number; outputTokens: number; costUsd: number };

type Content = Anthropic.Beta.BetaContentBlockParam[];

/**
 * One structured Claude call: the response is constrained to `schema`, validated with Zod,
 * and retried once with the validation error if the JSON is unusable (e.g. truncated).
 */
export async function generateStructured<S extends z.ZodType>({
  system,
  content,
  schema,
  effort = "medium",
  maxTokens = 16000,
}: {
  system: string;
  content: Content;
  schema: S;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; usage: AiUsage }> {
  const model = env.ANTHROPIC_MODEL;
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  let inputTokens = 0;
  let outputTokens = 0;
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await getClient().beta.messages.parse({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        output_config: { effort, format: betaZodOutputFormat(schema) },
        // On a safety decline the API re-runs the request on a fallback model in the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (e) {
      // Typed API errors (auth, rate limit, 5xx after SDK retries) bubble up to the caller.
      if (e instanceof Anthropic.APIError) throw e;
      // Anything else here is the SDK failing to parse the model's JSON: retry once.
      lastError = e instanceof Error ? e.message : String(e);
      messages.push({ role: "user", content: `Your previous output was not valid JSON for the schema (${lastError}). Return the complete, valid JSON object.` });
      continue;
    }

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;

    if (response.stop_reason === "refusal") {
      throw new AiRefusalError(response.stop_details?.category ?? null);
    }

    const parsed = schema.safeParse(response.parsed_output);
    if (parsed.success) {
      return {
        data: parsed.data,
        usage: { model, inputTokens, outputTokens, costUsd: estimateCostUsd(model, inputTokens, outputTokens) },
      };
    }

    lastError =
      response.stop_reason === "max_tokens"
        ? "the response was cut off before it finished"
        : parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    messages.push({ role: "assistant", content: response.content.filter((b) => b.type === "text") });
    messages.push({
      role: "user",
      content: `That output failed validation (${lastError}). Return the complete JSON object again, fixing these issues.`,
    });
  }

  throw new AiOutputError(`AI output could not be validated: ${lastError}`);
}

/** Image block from raw bytes. */
export function imageBlock(bytes: ArrayBuffer, mediaType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg") {
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: mediaType, data: Buffer.from(bytes).toString("base64") },
  };
}
