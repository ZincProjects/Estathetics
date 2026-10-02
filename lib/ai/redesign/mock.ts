import "server-only";
import sharp from "sharp";
import type { ImageRedesignProvider, RedesignInput } from "./provider";

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Mock redesign: keeps the exact original geometry (it is the original photo) and
 * re-grades it toward the theme palette, with a palette strip so variations differ visibly.
 */
export const mockRedesignProvider: ImageRedesignProvider = {
  name: "mock",
  async generate(input: RedesignInput) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 900));
    const variant = Math.abs(input.seed) % Math.max(1, input.palette.length);
    const tint = hexToRgb(input.palette[variant] ?? "#c8b8a0");

    const base = sharp(input.image).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
    const { data, info } = await base
      .modulate({ saturation: 0.55, brightness: 1.03 + (variant % 2) * 0.03 })
      .tint(tint)
      .jpeg()
      .toBuffer({ resolveWithObject: true });

    const stripH = Math.round(info.height * 0.035);
    const sw = Math.ceil(info.width / input.palette.length);
    const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${stripH}">${input.palette
      .map((c, i) => `<rect x="${i * sw}" y="0" width="${sw}" height="${stripH}" fill="${c}"/>`)
      .join("")}</svg>`;

    const image = await sharp(data)
      .composite([{ input: Buffer.from(strip), left: 0, top: 0 }])
      .jpeg({ quality: 88 })
      .toBuffer();
    return { image, providerRef: `mock-${input.themeSlug}-${input.seed}` };
  },
};
