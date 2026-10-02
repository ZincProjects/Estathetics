import "server-only";
import { env, logMockMode, mock } from "@/lib/env";
import { prompts } from "@/lib/prompts";
import { roomScanSchema, type RoomScan } from "@/lib/schemas/room-scan";
import { generateStructured, imageBlock, type AiUsage } from "./claude";
import { mockRoomScan } from "./mocks/room-scan";

export async function scanRoomPhoto(input: {
  photo: ArrayBuffer;
  roomName: string;
  roomType?: string | null;
  propertyType?: string | null;
}): Promise<{ scan: RoomScan; usage?: AiUsage; model: string; promptVersion: string; mocked: boolean }> {
  const p = prompts.roomScan;
  if (mock.claude) {
    logMockMode();
    await new Promise((r) => setTimeout(r, 1800)); // feel like real work in demos
    return { scan: mockRoomScan(input.roomType), model: "mock", promptVersion: p.version, mocked: true };
  }

  const { data, usage } = await generateStructured({
    system: p.system,
    content: [imageBlock(input.photo), { type: "text", text: p.user(input) }],
    schema: roomScanSchema,
    effort: "high", // spatial estimation benefits from more reasoning
  });
  return { scan: data, usage, model: env.ANTHROPIC_MODEL, promptVersion: p.version, mocked: false };
}
