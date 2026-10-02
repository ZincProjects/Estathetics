/**
 * Prompt registry. Each prompt lives in its own versioned file under /lib/prompts.
 * Point an entry at a new version to roll it out; old versions stay for reference.
 */
import { listingCopyV1 } from "./listing-copy.v1";
import { redesignV1 } from "./redesign.v1";
import { roomScanV1 } from "./room-scan.v1";

export const prompts = {
  roomScan: roomScanV1,
  redesign: redesignV1,
  listingCopy: listingCopyV1,
} as const;
