import "server-only";
import { env, logMockMode, mock } from "@/lib/env";
import { mockRedesignProvider } from "./mock";
import type { ImageRedesignProvider } from "./provider";
import { createReplicateProvider } from "./replicate";

export type { ImageRedesignProvider, RedesignInput } from "./provider";

let provider: ImageRedesignProvider | undefined;

/** Resolves the configured provider, falling back to mock mode when keys are missing. */
export function getRedesignProvider(): ImageRedesignProvider {
  if (provider) return provider;
  if (mock.redesign) {
    logMockMode();
    provider = mockRedesignProvider;
  } else {
    provider = createReplicateProvider({
      token: env.REPLICATE_API_TOKEN!,
      model: env.REPLICATE_REDESIGN_MODEL!,
      inputStyle: env.REPLICATE_INPUT_STYLE,
    });
  }
  return provider;
}
