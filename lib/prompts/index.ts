/**
 * Prompt registry. Each prompt lives in its own versioned file under /lib/prompts.
 * Point `current` at a new version to roll it out; old versions stay for reference.
 */
import { roomScanV1 } from "./room-scan.v1";

export const prompts = {
  roomScan: roomScanV1,
} as const;
