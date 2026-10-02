import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Every external service is optional: when its key is
 * missing the matching `mock.*` flag is true and the app falls back to fixtures.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),

  REDESIGN_PROVIDER: z.enum(["replicate", "mock"]).optional(),
  REPLICATE_API_TOKEN: z.string().min(1).optional(),
  REPLICATE_REDESIGN_MODEL: z.string().min(1).optional(),
  REPLICATE_WEBHOOK_SECRET: z.string().min(1).optional(),

  ONEMAP_EMAIL: z.string().optional(),
  ONEMAP_PASSWORD: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  APP_URL: z.string().url().default("http://localhost:3000"),
  FORCE_MOCK: z.enum(["true", "false"]).optional(),
});

// Treat blank values (e.g. `ANTHROPIC_API_KEY=` copied from .env.example) as unset → mock mode.
const raw = Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, v?.trim() ? v.trim() : undefined]));
const parsed = schema.safeParse(raw);
if (!parsed.success) {
  console.error("Invalid environment variables", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

const forced = env.FORCE_MOCK === "true";

export const mock = {
  claude: forced || !env.ANTHROPIC_API_KEY,
  redesign:
    forced ||
    env.REDESIGN_PROVIDER === "mock" ||
    !env.REPLICATE_API_TOKEN ||
    !env.REPLICATE_REDESIGN_MODEL,
  // OneMap's search endpoint is public; auth is only needed for themes/routing.
  onemapAuth: forced || !env.ONEMAP_EMAIL || !env.ONEMAP_PASSWORD,
  places: forced || !env.GOOGLE_PLACES_API_KEY,
} as const;

let logged = false;
export function logMockMode() {
  if (logged) return;
  logged = true;
  const on = Object.entries(mock)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (on.length) console.info(`[mock] running with mocked services: ${on.join(", ")}`);
}
