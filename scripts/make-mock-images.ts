// Renders demo room photos + hero image into /public/mock. Run: npx tsx scripts/make-mock-images.ts
import sharp from "sharp";
import { BARE_PALETTE, roomSvg, type RoomLayout } from "../lib/images/mock-room";
import { getPresetTheme } from "../lib/themes";

async function jpg(svg: string, out: string) {
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(out);
}

async function main() {
  const layouts: RoomLayout[] = ["living", "bedroom", "kitchen"];
  for (const l of layouts) {
    await jpg(roomSvg(l, BARE_PALETTE, { furnished: true }), `public/mock/room-${l}.jpg`);
    await jpg(roomSvg(l, BARE_PALETTE, { furnished: false }), `public/mock/room-${l}-empty.jpg`);
  }
  await jpg(roomSvg("living", getPresetTheme("japandi")!.render), "public/mock/hero-after.jpg");
  await jpg(roomSvg("living", BARE_PALETTE, { furnished: false }), "public/mock/hero-before.jpg");
}
main();
