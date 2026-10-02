import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class Anthropic {
    static APIError = APIError;
    beta = { messages: { parse } };
  }
  return { default: Anthropic };
});
vi.mock("@anthropic-ai/sdk/helpers/beta/zod", () => ({ betaZodOutputFormat: () => ({ type: "json_schema" }) }));

const { generateStructured, AiOutputError, AiRefusalError, estimateCostUsd } = await import("@/lib/ai/claude");

const schema = z.object({ name: z.string(), count: z.number() });
const reply = (parsed: unknown, extra: Record<string, unknown> = {}) => ({
  parsed_output: parsed,
  stop_reason: "end_turn",
  content: [{ type: "text", text: JSON.stringify(parsed) }],
  usage: { input_tokens: 100, output_tokens: 50 },
  ...extra,
});

describe("generateStructured", () => {
  beforeEach(() => parse.mockReset());

  it("returns validated data and usage on the first try", async () => {
    parse.mockResolvedValueOnce(reply({ name: "a", count: 1 }));
    const r = await generateStructured({ system: "s", content: [{ type: "text", text: "x" }], schema });
    expect(r.data).toEqual({ name: "a", count: 1 });
    expect(r.usage.inputTokens).toBe(100);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(parse.mock.calls[0][0]).toMatchObject({ fallbacks: "default", betas: ["server-side-fallback-2026-07-01"] });
  });

  it("retries once with the validation error, then succeeds", async () => {
    parse.mockResolvedValueOnce(reply({ name: "a", count: "one" })).mockResolvedValueOnce(reply({ name: "a", count: 1 }));
    const r = await generateStructured({ system: "s", content: [{ type: "text", text: "x" }], schema });
    expect(r.data.count).toBe(1);
    expect(r.usage.inputTokens).toBe(200);
    const retryMessages = parse.mock.calls[1][0].messages;
    expect(retryMessages.at(-1).content).toMatch(/count/);
  });

  it("retries when the SDK cannot parse JSON (e.g. truncated output)", async () => {
    parse.mockRejectedValueOnce(new SyntaxError("Unexpected end of JSON input")).mockResolvedValueOnce(reply({ name: "b", count: 2 }));
    const r = await generateStructured({ system: "s", content: [{ type: "text", text: "x" }], schema });
    expect(r.data.name).toBe("b");
  });

  it("gives up after two invalid outputs", async () => {
    parse.mockResolvedValue(reply({ nope: true }));
    await expect(generateStructured({ system: "s", content: [{ type: "text", text: "x" }], schema })).rejects.toBeInstanceOf(AiOutputError);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("surfaces refusals without retrying", async () => {
    parse.mockResolvedValueOnce(reply(null, { stop_reason: "refusal", stop_details: { category: "cyber" } }));
    await expect(generateStructured({ system: "s", content: [{ type: "text", text: "x" }], schema })).rejects.toBeInstanceOf(AiRefusalError);
    expect(parse).toHaveBeenCalledTimes(1);
  });
});

describe("estimateCostUsd", () => {
  it("prices Opus 5.5 per million tokens", () => {
    expect(estimateCostUsd("claude-opus-5-5", 1_000_000, 100_000)).toBeCloseTo(6);
  });
});
